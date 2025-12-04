
# ESP32 Smart Irrigation System - Complete Code Documentation

## Overview
This document provides the complete ESP32 code for both modules in the Smart Irrigation System:

1. **ESP32 Irrigation System** - Main control unit for sensors and irrigation
2. **ESP32-CAM Module** - Camera monitoring system

## Hardware Requirements

### ESP32 Main Controller Components:
- ESP32 Development Board
- DHT22 Temperature & Humidity Sensor
- Soil Moisture Sensor (Analog)
- 2x HC-SR04 Ultrasonic Sensors (Water & Vitamin tank levels)
- 2x DS18B20 Temperature Sensors (Tank temperatures)
- BH1750 Light Sensor (I2C)
- Water Flow Sensor (Hall Effect)
- 4-Channel Relay Module
- Water Pump (12V)
- Cooling Fan (12V)
- Power Supply (12V/5V)

### ESP32-CAM Components:
- ESP32-CAM Module (AI-Thinker recommended)
- MicroSD Card (optional)
- External antenna (optional for better WiFi)
- 5V Power Supply (minimum 2A)

## Pin Configuration

### ESP32 Main Controller:
```cpp
// Sensor Pins
#define DHT_PIN 4              // DHT22 Data
#define SOIL_MOISTURE_PIN A0   // Analog Soil Moisture
#define TEMP_SENSOR_PIN 2      // DS18B20 (OneWire)
#define FLOW_SENSOR_PIN 3      // Flow Sensor Input

// HC-SR04 Ultrasonic Sensors
#define WATER_TANK_TRIG_PIN 18    // Water Tank Trigger
#define WATER_TANK_ECHO_PIN 19    // Water Tank Echo
#define VITAMIN_TANK_TRIG_PIN 25  // Vitamin Tank Trigger
#define VITAMIN_TANK_ECHO_PIN 26  // Vitamin Tank Echo

// Control Pins
#define PUMP_PIN 5             // Water Pump Relay
#define FAN_PIN 6              // Fan Relay

// I2C (BH1750 Light Sensor)
// GPIO 21 - SDA
// GPIO 22 - SCL
```

### ESP32-CAM:
Uses predefined camera pins from `camera_pins.h` file for AI-Thinker model.

## Software Features

### ESP32 Main Controller Features:
1. **Sensor Monitoring**:
   - Temperature and humidity (DHT22)
   - Soil moisture level
   - Water and vitamin tank levels (HC-SR04)
   - Tank temperatures (DS18B20)
   - Light level (BH1750)
   - Water flow rate

2. **Automatic Control**:
   - Smart irrigation based on soil moisture
   - Tank level safety checks
   - Temperature-based fan control
   - Safety timeouts and alerts

3. **Data Logging**:
   - Real-time sensor data to Supabase
   - Irrigation event logging
   - System status updates

4. **Remote Control**:
   - Manual device control via database
   - Auto/manual mode switching
   - Real-time status monitoring

### ESP32-CAM Features:
1. **Live Video Streaming**:
   - MJPEG stream at `/stream`
   - Adjustable quality and frame size
   - Multiple concurrent connections

2. **Image Capture**:
   - Single image capture at `/capture`
   - Downloadable JPEG format
   - Camera setting adjustments

3. **Web Interface**:
   - Built-in HTML interface at `/`
   - Status information at `/status`
   - Settings control at `/settings`

4. **Status Reporting**:
   - Periodic status updates to Supabase
   - System health monitoring
   - Network connectivity status

## Configuration Instructions

### 1. WiFi Setup (Both Modules):
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Supabase Configuration (Both Modules):
```cpp
const char* supabaseUrl = "https://nkxvqdrqnzzrisfmyway.supabase.co";
const char* supabaseKey = "your-api-key";
```

### 3. Tank Specifications (Main Controller):
```cpp
#define WATER_TANK_HEIGHT 50    // cm
#define VITAMIN_TANK_HEIGHT 30  // cm
```

### 4. Camera Settings (ESP32-CAM):
The camera is automatically configured for AI-Thinker model with optimal settings for PSRAM boards.

## Installation Steps

### ESP32 Main Controller:
1. Install required libraries:
   - DHT sensor library
   - ArduinoJson
   - OneWire
   - DallasTemperature
   - BH1750

2. Upload `esp32_irrigation_system.ino`
3. Connect sensors according to pin configuration
4. Configure WiFi and Supabase settings
5. Power on and monitor serial output

### ESP32-CAM:
1. Install ESP32 board package in Arduino IDE
2. Select "AI Thinker ESP32-CAM" board
3. Upload `esp32_cam_monitoring.ino` along with `camera_pins.h`
4. Connect to 5V power supply (minimum 2A)
5. Access camera interface via IP address

## Serial Monitor Output

### Main Controller Output:
```
=== ESP32 Irrigation System Started ===
- Sensor monitoring active
- HC-SR04 ultrasonic sensors for tank levels
- Auto control system ready
- Data logging to Supabase enabled

=== Sensor Readings ===
Temperature: 25.30°C
Humidity: 65.20%
Soil Moisture: 45.60%
Water Tank: 75.30% (Distance: 12.35cm)
Vitamin Tank: 68.90% (Distance: 9.33cm)
Water Temp: 24.50°C
Vitamin Temp: 23.10°C
Flow Rate: 2.15 L/min
Total Volume: 15.75 L
Light Level: 850.25 lux
System Status - Pump: OFF, Fan: OFF, Auto: ENABLED
```

### Camera Module Output:
```
ESP32-CAM IP: 192.168.1.100
Camera server started
Status update sent: 201
```

## API Endpoints

### ESP32-CAM Endpoints:
- `http://[IP]/` - Main interface
- `http://[IP]/stream` - Live video stream
- `http://[IP]/capture` - Single image capture
- `http://[IP]/status` - System status JSON
- `http://[IP]/settings` - Camera settings (POST)

## Troubleshooting

### Common Issues:
1. **Camera Init Failed**: Check power supply (5V/2A minimum)
2. **WiFi Connection Failed**: Verify SSID/password
3. **Sensor Reading Errors**: Check wiring and power connections
4. **Database Connection Issues**: Verify Supabase URL/key
5. **HC-SR04 Errors**: Ensure 5V power and stable mounting

### HC-SR04 Troubleshooting:
- Mount sensors vertically pointing down
- Ensure clean, unobstructed sensor faces
- Check distance readings in serial monitor
- Calibrate tank height constants
- Verify 5V power supply to sensors

## Power Requirements

### ESP32 Main Controller:
- ESP32: 5V/1A via USB or external
- Sensors: 3.3V-5V depending on sensor
- Pump/Fan: 12V via relay module
- Total system: 12V/3A recommended

### ESP32-CAM:
- Module: 5V/2A minimum (camera requires high current)
- Optional: 3.3V for low power applications (reduced performance)

## Security Considerations

1. **WiFi Security**: Use WPA2/WPA3 with strong passwords
2. **Network Isolation**: Consider IoT VLAN for ESP32 devices  
3. **API Security**: Supabase keys are included (public project)
4. **Physical Security**: Secure device mounting and connections

## Maintenance

### Regular Checks:
- Clean HC-SR04 sensor faces monthly
- Check water-tight connections
- Monitor serial output for errors
- Verify database connectivity
- Update WiFi credentials if changed

### Software Updates:
- Update libraries periodically
- Monitor for ESP32 core updates
- Backup working configurations
- Test changes on development setup first

This complete code provides a robust, feature-rich smart irrigation system with visual monitoring capabilities. Both modules work independently but can be integrated for comprehensive farm monitoring and control.
