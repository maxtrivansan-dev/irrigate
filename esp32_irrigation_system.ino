#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <BH1750.h>
#include <RTClib.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const char* supabaseUrl = "https://nkxvqdrqnzzrisfmyway.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHZxZHJxbnp6cmlzZm15d2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzgxNDIsImV4cCI6MjA2NzM1NDE0Mn0.j4ZxLCookSbomfPIxMWsUp7BO-98c7AKhOutuk9_j8A";

// Pin definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define SOIL_MOISTURE_PIN A0
#define TEMP_SENSOR_PIN 2
#define PUMP_PIN 5
#define FAN_PIN 6
#define FLOW_SENSOR_PIN 3
#define WATER_VALVE_PIN 7
#define VITAMIN_VALVE_PIN 8

// HC-SR04 Ultrasonic Sensor Pins
#define WATER_TANK_TRIG_PIN 18
#define WATER_TANK_ECHO_PIN 19
#define VITAMIN_TANK_TRIG_PIN 25
#define VITAMIN_TANK_ECHO_PIN 26

// Tank specifications (in centimeters)
#define WATER_TANK_HEIGHT 50
#define VITAMIN_TANK_HEIGHT 30
#define MIN_DISTANCE_CM 2
#define MAX_DISTANCE_CM 400

// Sensor objects
DHT dht(DHT_PIN, DHT_TYPE);
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensors(&oneWire);
BH1750 lightMeter;
RTC_DS3231 rtc;

// Flow sensor variables
volatile int flowPulseCount = 0;
float flowRate = 0.0;
unsigned long flowLastTime = 0;
float totalFlowVolume = 0.0;

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastAutoControl = 0;
unsigned long lastThresholdSync = 0;
unsigned long lastScheduleCheck = 0;
const unsigned long SENSOR_INTERVAL = 5000;
const unsigned long SEND_INTERVAL = 30000;
const unsigned long CONTROL_INTERVAL = 60000;
const unsigned long THRESHOLD_SYNC_INTERVAL = 300000; // 5 minutes
const unsigned long SCHEDULE_CHECK_INTERVAL = 60000; // 1 minute

// System thresholds (will be updated from database)
struct SystemThresholds {
  float maxTemperature = 35.0;
  float minSoilMoisture = 42.0;
  float lowWaterLevel = 20.0;
  float lowVitaminLevel = 15.0;
  float minLightLevel = 300.0;
} thresholds;

// Irrigation schedule (will be updated from database)
struct IrrigationSchedule {
  bool enabled = true;
  int morningHour = 8;
  int morningMinute = 0;
  int eveningHour = 18;
  int eveningMinute = 0;
  bool weekendMode = true;
  bool tankRotation = true;
  bool useWaterTank = true; // For tank rotation
} schedule;

// System status
struct SystemStatus {
  bool pumpActive = false;
  bool fanActive = false;
  bool autoMode = true;
  bool waterValveActive = false;
  bool vitaminValveActive = false;
  float lastSoilMoisture = 0;
  float lastTemperature = 0;
  float lastWaterLevel = 0;
  float lastVitaminLevel = 0;
  unsigned long pumpStartTime = 0;
  bool morningIrrigationDone = false;
  bool eveningIrrigationDone = false;
} systemStatus;

// Flow sensor interrupt handler
void IRAM_ATTR flowPulseCounter() {
  flowPulseCount++;
}

// Function to measure distance using HC-SR04
float measureDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH, 30000);
  
  if (duration == 0) {
    return -1;
  }
  
  float distance = (duration * 0.034) / 2;
  
  if (distance < MIN_DISTANCE_CM || distance > MAX_DISTANCE_CM) {
    return -1;
  }
  
  return distance;
}

// Function to convert distance to tank level percentage
float distanceToLevel(float distance, float tankHeight) {
  if (distance < 0) {
    return -1;
  }
  
  float waterHeight = tankHeight - distance;
  
  if (waterHeight < 0) waterHeight = 0;
  if (waterHeight > tankHeight) waterHeight = tankHeight;
  
  float levelPercentage = (waterHeight / tankHeight) * 100.0;
  
  return levelPercentage;
}

// Function to sync thresholds from database
void syncThresholds() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping threshold sync");
    return;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/thresholds?select=*&order=updated_at.desc&limit=1");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Threshold response: " + response);
    
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    if (doc.size() > 0) {
      JsonObject threshold = doc[0];
      
      thresholds.maxTemperature = threshold["max_temperature"] | 35.0;
      thresholds.minSoilMoisture = threshold["min_soil_moisture"] | 42.0;
      thresholds.lowWaterLevel = threshold["low_water_level"] | 20.0;
      thresholds.lowVitaminLevel = threshold["low_vitamin_level"] | 15.0;
      thresholds.minLightLevel = threshold["min_light_level"] | 300.0;
      
      Serial.println("=== Thresholds Updated ===");
      Serial.printf("Max Temperature: %.1f°C\n", thresholds.maxTemperature);
      Serial.printf("Min Soil Moisture: %.1f%%\n", thresholds.minSoilMoisture);
      Serial.printf("Low Water Level: %.1f%%\n", thresholds.lowWaterLevel);
      Serial.printf("Low Vitamin Level: %.1f%%\n", thresholds.lowVitaminLevel);
      Serial.printf("Min Light Level: %.1f lux\n", thresholds.minLightLevel);
    }
  } else {
    Serial.printf("Error syncing thresholds: %d\n", httpResponseCode);
  }
  
  http.end();
}

// Function to sync irrigation schedule from database
void syncSchedule() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping schedule sync");
    return;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/irrigation_schedule?select=*&order=updated_at.desc&limit=1");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Schedule response: " + response);
    
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    if (doc.size() > 0) {
      JsonObject scheduleData = doc[0];
      
      schedule.enabled = scheduleData["enabled"] | true;
      schedule.weekendMode = scheduleData["weekend_mode"] | true;
      schedule.tankRotation = scheduleData["tank_rotation"] | true;
      
      // Parse morning time
      String morningTime = scheduleData["morning_time"] | "08:00:00";
      schedule.morningHour = morningTime.substring(0, 2).toInt();
      schedule.morningMinute = morningTime.substring(3, 5).toInt();
      
      // Parse evening time
      String eveningTime = scheduleData["evening_time"] | "18:00:00";
      schedule.eveningHour = eveningTime.substring(0, 2).toInt();
      schedule.eveningMinute = eveningTime.substring(3, 5).toInt();
      
      Serial.println("=== Schedule Updated ===");
      Serial.printf("Enabled: %s\n", schedule.enabled ? "YES" : "NO");
      Serial.printf("Morning: %02d:%02d\n", schedule.morningHour, schedule.morningMinute);
      Serial.printf("Evening: %02d:%02d\n", schedule.eveningHour, schedule.eveningMinute);
      Serial.printf("Weekend Mode: %s\n", schedule.weekendMode ? "YES" : "NO");
      Serial.printf("Tank Rotation: %s\n", schedule.tankRotation ? "YES" : "NO");
    }
  } else {
    Serial.printf("Error syncing schedule: %d\n", httpResponseCode);
  }
  
  http.end();
}

// Function to check and execute scheduled irrigation
void checkScheduledIrrigation() {
  if (!schedule.enabled) return;
  
  DateTime now = rtc.now();
  int currentHour = now.hour();
  int currentMinute = now.minute();
  int dayOfWeek = now.dayOfTheWeek(); // 0 = Sunday, 6 = Saturday
  
  // Check if it's weekend and weekend mode is disabled
  if (!schedule.weekendMode && (dayOfWeek == 0 || dayOfWeek == 6)) {
    return;
  }
  
  // Reset daily flags at midnight
  if (currentHour == 0 && currentMinute == 0) {
    systemStatus.morningIrrigationDone = false;
    systemStatus.eveningIrrigationDone = false;
    Serial.println("Daily irrigation flags reset");
  }
  
  // Check morning irrigation
  if (!systemStatus.morningIrrigationDone && 
      currentHour == schedule.morningHour && 
      currentMinute == schedule.morningMinute) {
    
    Serial.println("=== Scheduled Morning Irrigation ===");
    executeScheduledIrrigation("Morning scheduled irrigation");
    systemStatus.morningIrrigationDone = true;
  }
  
  // Check evening irrigation
  if (!systemStatus.eveningIrrigationDone && 
      currentHour == schedule.eveningHour && 
      currentMinute == schedule.eveningMinute) {
    
    Serial.println("=== Scheduled Evening Irrigation ===");
    executeScheduledIrrigation("Evening scheduled irrigation");
    systemStatus.eveningIrrigationDone = true;
  }
}

// Function to execute scheduled irrigation
void executeScheduledIrrigation(String reason) {
  // Check tank levels before irrigation
  bool waterTankOK = (systemStatus.lastWaterLevel >= thresholds.lowWaterLevel);
  bool vitaminTankOK = (systemStatus.lastVitaminLevel >= thresholds.lowVitaminLevel);
  
  if (!waterTankOK && !vitaminTankOK) {
    Serial.println("SCHEDULED IRRIGATION BLOCKED: Both tanks too low!");
    return;
  }
  
  // Determine which tank to use
  bool useWater = true;
  if (schedule.tankRotation) {
    // Alternate between tanks or use available one
    if (waterTankOK && vitaminTankOK) {
      useWater = schedule.useWaterTank;
      schedule.useWaterTank = !schedule.useWaterTank; // Toggle for next time
    } else {
      useWater = waterTankOK;
    }
  } else {
    // Always prefer water tank if available
    useWater = waterTankOK;
  }
  
  // Start irrigation
  startScheduledIrrigation(reason, useWater);
}

void setup() {
  Serial.begin(115200);
  
  // Initialize I2C for BH1750 and RTC
  Wire.begin();
  
  // Initialize RTC
  if (!rtc.begin()) {
    Serial.println("Couldn't find RTC");
    while (1);
  }
  
  if (rtc.lostPower()) {
    Serial.println("RTC lost power, setting the time!");
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  
  // Initialize sensors
  dht.begin();
  temperatureSensors.begin();
  
  // Initialize BH1750 light sensor
  if (lightMeter.begin()) {
    Serial.println("BH1750 initialized successfully");
  } else {
    Serial.println("Error initializing BH1750");
  }
  
  // Initialize pins
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(WATER_VALVE_PIN, OUTPUT);
  pinMode(VITAMIN_VALVE_PIN, OUTPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  
  // Initialize HC-SR04 pins
  pinMode(WATER_TANK_TRIG_PIN, OUTPUT);
  pinMode(WATER_TANK_ECHO_PIN, INPUT);
  pinMode(VITAMIN_TANK_TRIG_PIN, OUTPUT);
  pinMode(VITAMIN_TANK_ECHO_PIN, INPUT);
  
  // Attach interrupt for flow sensor
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), flowPulseCounter, FALLING);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP32 Irrigation System IP: ");
  Serial.println(WiFi.localIP());
  
  // Initial sync of thresholds and schedule
  syncThresholds();
  delay(1000);
  syncSchedule();
  
  // Display current RTC time
  DateTime now = rtc.now();
  Serial.printf("Current RTC time: %02d/%02d/%04d %02d:%02d:%02d\n", 
    now.day(), now.month(), now.year(), now.hour(), now.minute(), now.second());
  
  Serial.println("=== ESP32 Irrigation System Started ===");
  Serial.println("- Sensor monitoring active");
  Serial.println("- HC-SR04 ultrasonic sensors for tank levels");
  Serial.println("- RTC module for scheduled irrigation");
  Serial.println("- Database threshold synchronization");
  Serial.println("- Auto control system ready");
  Serial.println("- Data logging to Supabase enabled");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    lastSensorRead = currentTime;
  }
  
  // Send data to Supabase at regular intervals
  if (currentTime - lastDataSend >= SEND_INTERVAL) {
    sendSensorData();
    lastDataSend = currentTime;
  }
  
  // Auto control system
  if (currentTime - lastAutoControl >= CONTROL_INTERVAL) {
    if (systemStatus.autoMode) {
      performAutoControl();
    }
    lastAutoControl = currentTime;
  }
  
  // Sync thresholds from database
  if (currentTime - lastThresholdSync >= THRESHOLD_SYNC_INTERVAL) {
    syncThresholds();
    syncSchedule();
    lastThresholdSync = currentTime;
  }
  
  // Check for scheduled irrigation
  if (currentTime - lastScheduleCheck >= SCHEDULE_CHECK_INTERVAL) {
    checkScheduledIrrigation();
    lastScheduleCheck = currentTime;
  }
  
  // Check for manual device control updates
  checkDeviceControl();
  
  delay(1000);
}

void readSensors() {
  // Calculate flow rate
  if (millis() - flowLastTime > 1000) {
    flowRate = ((1000.0 / (millis() - flowLastTime)) * flowPulseCount) / 7.5;
    totalFlowVolume += (flowRate / 60.0);
    flowPulseCount = 0;
    flowLastTime = millis();
  }
  
  Serial.println("=== Sensor Readings ===");
  
  // DHT22 readings
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Soil moisture (convert ADC reading to percentage)
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = map(soilMoistureRaw, 0, 4095, 0, 100);
  
  // Water and vitamin tank levels using HC-SR04
  float waterDistance = measureDistance(WATER_TANK_TRIG_PIN, WATER_TANK_ECHO_PIN);
  float vitaminDistance = measureDistance(VITAMIN_TANK_TRIG_PIN, VITAMIN_TANK_ECHO_PIN);
  
  float waterLevel = distanceToLevel(waterDistance, WATER_TANK_HEIGHT);
  float vitaminLevel = distanceToLevel(vitaminDistance, VITAMIN_TANK_HEIGHT);
  
  // Temperature sensors
  temperatureSensors.requestTemperatures();
  float waterTemp = temperatureSensors.getTempCByIndex(0);
  float vitaminTemp = temperatureSensors.getTempCByIndex(1);
  
  // Light sensor reading
  float lightLevel = lightMeter.readLightLevel();
  
  // Update system status
  systemStatus.lastSoilMoisture = soilMoisture;
  systemStatus.lastTemperature = temperature;
  systemStatus.lastWaterLevel = waterLevel;
  systemStatus.lastVitaminLevel = vitaminLevel;
  
  // Display current time from RTC
  DateTime now = rtc.now();
  Serial.printf("RTC Time: %02d:%02d:%02d\n", now.hour(), now.minute(), now.second());
  
  Serial.printf("Temperature: %.2f°C\n", temperature);
  Serial.printf("Humidity: %.2f%%\n", humidity);
  Serial.printf("Soil Moisture: %.2f%%\n", soilMoisture);
  
  if (waterLevel >= 0) {
    Serial.printf("Water Tank: %.2f%% (Distance: %.2fcm)\n", waterLevel, waterDistance);
  } else {
    Serial.println("Water Tank: ERROR - Check sensor connection");
  }
  
  if (vitaminLevel >= 0) {
    Serial.printf("Vitamin Tank: %.2f%% (Distance: %.2fcm)\n", vitaminLevel, vitaminDistance);
  } else {
    Serial.println("Vitamin Tank: ERROR - Check sensor connection");
  }
  
  Serial.printf("Water Temp: %.2f°C\n", waterTemp);
  Serial.printf("Vitamin Temp: %.2f°C\n", vitaminTemp);
  Serial.printf("Flow Rate: %.2f L/min\n", flowRate);
  Serial.printf("Total Volume: %.2f L\n", totalFlowVolume);
  Serial.printf("Light Level: %.2f lux\n", lightLevel);
  Serial.printf("System Status - Pump: %s, Fan: %s, Auto: %s\n", 
    systemStatus.pumpActive ? "ON" : "OFF",
    systemStatus.fanActive ? "ON" : "OFF",
    systemStatus.autoMode ? "ENABLED" : "DISABLED"
  );
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping data send");
    return;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/sensor_readings");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  // Read current sensor values
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = map(soilMoistureRaw, 0, 4095, 0, 100);
  
  // Get tank levels using HC-SR04
  float waterDistance = measureDistance(WATER_TANK_TRIG_PIN, WATER_TANK_ECHO_PIN);
  float vitaminDistance = measureDistance(VITAMIN_TANK_TRIG_PIN, VITAMIN_TANK_ECHO_PIN);
  
  float waterLevel = distanceToLevel(waterDistance, WATER_TANK_HEIGHT);
  float vitaminLevel = distanceToLevel(vitaminDistance, VITAMIN_TANK_HEIGHT);
  
  temperatureSensors.requestTemperatures();
  float waterTemp = temperatureSensors.getTempCByIndex(0);
  float vitaminTemp = temperatureSensors.getTempCByIndex(1);
  
  float lightLevel = lightMeter.readLightLevel();
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["temperature"] = isnan(temperature) ? nullptr : temperature;
  doc["humidity"] = isnan(humidity) ? nullptr : humidity;
  doc["soil_moisture"] = soilMoisture;
  
  if (waterLevel >= 0) {
    doc["water_tank_level"] = waterLevel;
  } else {
    doc["water_tank_level"] = nullptr;
    Serial.println("Warning: Invalid water tank reading, sending null");
  }
  
  if (vitaminLevel >= 0) {
    doc["vitamin_tank_level"] = vitaminLevel;
  } else {
    doc["vitamin_tank_level"] = nullptr;
    Serial.println("Warning: Invalid vitamin tank reading, sending null");
  }
  
  doc["water_temp"] = waterTemp;
  doc["vitamin_temp"] = vitaminTemp;
  doc["flow_rate"] = flowRate;
  doc["total_flow_volume"] = totalFlowVolume;
  doc["light_level"] = lightLevel;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending sensor data to Supabase:");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("HTTP Response: %d\n", httpResponseCode);
    if (httpResponseCode != 201) {
      Serial.println("Response: " + response);
    } else {
      Serial.println("Data sent successfully!");
    }
  } else {
    Serial.printf("Error sending data: %d\n", httpResponseCode);
  }
  
  http.end();
}

void performAutoControl() {
  Serial.println("=== Auto Control System ===");
  
  // Check tank levels before irrigation
  bool waterTankOK = (systemStatus.lastWaterLevel >= thresholds.lowWaterLevel);
  bool vitaminTankOK = (systemStatus.lastVitaminLevel >= thresholds.lowVitaminLevel);
  
  // Soil moisture control with updated thresholds
  if (systemStatus.lastSoilMoisture < thresholds.minSoilMoisture && !systemStatus.pumpActive) {
    if (waterTankOK || vitaminTankOK) {
      bool useWater = waterTankOK; // Prefer water tank
      startIrrigation("Low soil moisture detected", useWater);
    } else {
      Serial.println("IRRIGATION BLOCKED: Both tanks too low!");
    }
  } else if (systemStatus.lastSoilMoisture > (thresholds.minSoilMoisture + 20.0) && systemStatus.pumpActive) {
    stopIrrigation("Soil moisture sufficient");
  }
  
  // Temperature control with updated thresholds
  if (systemStatus.lastTemperature > thresholds.maxTemperature && !systemStatus.fanActive) {
    startFan("High temperature detected");
  } else if (systemStatus.lastTemperature < (thresholds.maxTemperature - 5.0) && systemStatus.fanActive) {
    stopFan("Temperature normalized");
  }
  
  // Low tank level alerts with updated thresholds
  if (systemStatus.lastWaterLevel >= 0 && systemStatus.lastWaterLevel < thresholds.lowWaterLevel) {
    Serial.printf("ALERT: Water tank critically low! (%.1f%% < %.1f%%)\n", 
      systemStatus.lastWaterLevel, thresholds.lowWaterLevel);
  }
  
  if (systemStatus.lastVitaminLevel >= 0 && systemStatus.lastVitaminLevel < thresholds.lowVitaminLevel) {
    Serial.printf("ALERT: Vitamin tank critically low! (%.1f%% < %.1f%%)\n", 
      systemStatus.lastVitaminLevel, thresholds.lowVitaminLevel);
  }
  
  // Safety check: Stop pump if running too long (10 minutes max)
  if (systemStatus.pumpActive && (millis() - systemStatus.pumpStartTime) > 600000) {
    stopIrrigation("Safety timeout - maximum irrigation time reached");
  }
}

void startIrrigation(String reason, bool useWaterTank) {
  digitalWrite(PUMP_PIN, HIGH);
  systemStatus.pumpActive = true;
  systemStatus.pumpStartTime = millis();
  
  // Control valves
  if (useWaterTank) {
    digitalWrite(WATER_VALVE_PIN, HIGH);
    digitalWrite(VITAMIN_VALVE_PIN, LOW);
    systemStatus.waterValveActive = true;
    systemStatus.vitaminValveActive = false;
    Serial.println("IRRIGATION STARTED (Water Tank): " + reason);
  } else {
    digitalWrite(WATER_VALVE_PIN, LOW);
    digitalWrite(VITAMIN_VALVE_PIN, HIGH);
    systemStatus.waterValveActive = false;
    systemStatus.vitaminValveActive = true;
    Serial.println("IRRIGATION STARTED (Vitamin Tank): " + reason);
  }
  
  logIrrigationEvent("start", reason, useWaterTank ? "water" : "vitamin");
}

void startScheduledIrrigation(String reason, bool useWaterTank) {
  startIrrigation(reason, useWaterTank);
}

void stopIrrigation(String reason) {
  digitalWrite(PUMP_PIN, LOW);
  digitalWrite(WATER_VALVE_PIN, LOW);
  digitalWrite(VITAMIN_VALVE_PIN, LOW);
  
  systemStatus.pumpActive = false;
  systemStatus.waterValveActive = false;
  systemStatus.vitaminValveActive = false;
  
  Serial.println("IRRIGATION STOPPED: " + reason);
  logIrrigationEvent("stop", reason, systemStatus.waterValveActive ? "water" : "vitamin");
}

void startFan(String reason) {
  digitalWrite(FAN_PIN, HIGH);
  systemStatus.fanActive = true;
  Serial.println("FAN STARTED: " + reason);
}

void stopFan(String reason) {
  digitalWrite(FAN_PIN, LOW);
  systemStatus.fanActive = false;
  Serial.println("FAN STOPPED: " + reason);
}

void logIrrigationEvent(String action, String reason, String tankType) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/irrigation_logs");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  DynamicJsonDocument doc(512);
  doc["trigger_reason"] = reason;
  doc["tank_type"] = tankType;
  doc["soil_moisture_before"] = systemStatus.lastSoilMoisture;
  
  if (action == "start") {
    doc["duration_seconds"] = 0;
  } else {
    unsigned long duration = (millis() - systemStatus.pumpStartTime) / 1000;
    doc["duration_seconds"] = duration;
    doc["soil_moisture_after"] = systemStatus.lastSoilMoisture;
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  Serial.printf("Irrigation log sent: %d\n", httpResponseCode);
  
  http.end();
}

void checkDeviceControl() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/device_control?select=*");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, response);
    
    // Process device control commands
    for (JsonObject device : doc.as<JsonArray>()) {
      String deviceName = device["device_name"];
      bool isActive = device["is_active"];
      bool autoMode = device["auto_mode"];
      
      if (deviceName == "pump") {
        if (!autoMode) {
          systemStatus.autoMode = false;
          digitalWrite(PUMP_PIN, isActive ? HIGH : LOW);
          systemStatus.pumpActive = isActive;
          if (isActive) systemStatus.pumpStartTime = millis();
        } else {
          systemStatus.autoMode = true;
        }
        Serial.printf("Pump: %s (Auto: %s)\n", 
          isActive ? "ON" : "OFF", 
          autoMode ? "ENABLED" : "DISABLED");
      } else if (deviceName == "fan") {
        digitalWrite(FAN_PIN, isActive ? HIGH : LOW);
        systemStatus.fanActive = isActive;
        Serial.printf("Fan: %s\n", isActive ? "ON" : "OFF");
      } else if (deviceName == "water_valve") {
        digitalWrite(WATER_VALVE_PIN, isActive ? HIGH : LOW);
        systemStatus.waterValveActive = isActive;
        Serial.printf("Water Valve: %s\n", isActive ? "ON" : "OFF");
      } else if (deviceName == "vitamin_valve") {
        digitalWrite(VITAMIN_VALVE_PIN, isActive ? HIGH : LOW);
        systemStatus.vitaminValveActive = isActive;
        Serial.printf("Vitamin Valve: %s\n", isActive ? "ON" : "OFF");
      }
    }
  }
  
  http.end();
}
