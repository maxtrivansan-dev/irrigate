
# ESP32 Smart Irrigation System Setup

## Hardware Requirements

### Components:
- ESP32 Development Board
- DHT22 Temperature & Humidity Sensor
- Soil Moisture Sensor
- 2x HC-SR04 Ultrasonic Sensors (for tank level monitoring)
- 2x DS18B20 Temperature Sensors (for water and vitamin tank temperatures)
- BH1750 Light Sensor
- Water Flow Sensor (Hall Effect)
- 4x Relay Module (for controlling pump, fan, and valves)
- Water Pump
- Fan
- 2x Solenoid Valves (for water and vitamin tanks)
- Jumper wires and breadboard
- Power supply (12V for pump and valves, 5V for ESP32)

### Pin Connections:

```
ESP32 Pin -> Component
GPIO 4    -> DHT22 Data Pin
GPIO 34   -> Soil Moisture Sensor Analog Output
GPIO 2    -> DS18B20 Temperature Sensors (Water & Vitamin tanks)
GPIO 3    -> Water Flow Sensor Input
GPIO 5    -> Water Pump Relay Control
GPIO 6    -> Fan Relay Control

// HC-SR04 Ultrasonic Sensors for Tank Level Monitoring
GPIO 18   -> Water Tank HC-SR04 Trigger Pin
GPIO 19   -> Water Tank HC-SR04 Echo Pin
GPIO 25   -> Vitamin Tank HC-SR04 Trigger Pin
GPIO 26   -> Vitamin Tank HC-SR04 Echo Pin

// I2C for BH1750 Light Sensor
GPIO 21   -> SDA (I2C Data)
GPIO 22   -> SCL (I2C Clock)
```

## Software Setup

### 1. Arduino IDE Setup:
1. Install ESP32 board package in Arduino IDE
2. Install required libraries:
   - `DHT sensor library` by Adafruit
   - `ArduinoJson` by Benoit Blanchon
   - `OneWire` by Jim Studt
   - `DallasTemperature` by Miles Burton
   - `BH1750` by Christopher Laws
   - `HTTPClient` (included with ESP32 package)

### 2. Configuration:
1. Update WiFi credentials in the code:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. Adjust tank specifications according to your setup:
   ```cpp
   #define WATER_TANK_HEIGHT 50    // Total height of water tank in cm
   #define VITAMIN_TANK_HEIGHT 30  // Total height of vitamin tank in cm
   ```

3. The Supabase URL and API key are already configured for your project.

### 3. Upload Code:
1. Connect ESP32 to your computer via USB
2. Select the correct board and port in Arduino IDE
3. Upload the `esp32_irrigation_system.ino` file

## HC-SR04 Tank Level Monitoring

### How It Works:
- **Ultrasonic Distance Measurement**: HC-SR04 sensors measure the distance from the sensor to the water/vitamin surface
- **Level Calculation**: Tank level = (Tank Height - Measured Distance) / Tank Height × 100%
- **Accurate Readings**: Much more accurate than analog sensors, immune to liquid conductivity changes

### Installation Tips:
1. **Mounting Position**: Mount sensors at the top of each tank, pointing straight down
2. **Waterproofing**: Ensure sensor faces are protected from splashing but not sealed
3. **Calibration**: Measure your actual tank height and update the constants in code
4. **Testing**: Test with empty and full tanks to verify accuracy

### Advantages over Analog Sensors:
- **No Liquid Contact**: Sensors don't touch the liquid, preventing corrosion
- **Higher Accuracy**: ±3mm accuracy vs ±10% with analog sensors  
- **No Calibration Drift**: Digital measurement doesn't drift over time
- **Works with Any Liquid**: Not affected by liquid conductivity or pH

## Features

### Automatic Functions:
- **Sensor Monitoring**: Reads all sensors every 5 seconds including HC-SR04 tank levels
- **Data Transmission**: Sends sensor data to Supabase every 30 seconds
- **Smart Irrigation**: Checks tank levels before starting irrigation
- **Auto Control**: Triggers irrigation based on soil moisture and tank availability
- **Fan Control**: Activates when temperature exceeds threshold
- **Tank Level Alerts**: Warns when tanks are critically low
- **Safety Checks**: Prevents operation when both tanks are empty

### Enhanced Tank Monitoring:
- **Real-time Level Tracking**: Continuous monitoring of water and vitamin tank levels
- **Critical Level Alerts**: Automatic warnings when tanks drop below safe levels
- **Irrigation Safety**: Prevents pump activation when tanks are too low
- **Error Detection**: Identifies sensor connection problems and reports them

### Manual Control:
- All devices can be controlled manually through the web interface
- Real-time device state synchronization
- Override automatic functions when needed

### Safety Features:
- Emergency stop when both tanks are critically low
- Prevents irrigation without adequate tank levels
- Automatic timeout for irrigation cycles (10 minutes max)
- Sensor error detection and reporting
- Real-time monitoring and logging

## Monitoring & Troubleshooting

### Serial Monitor Output:
The ESP32 provides detailed information via serial connection:
- Sensor readings every 5 seconds including distance measurements
- Tank level percentages with raw distance values for debugging
- Device state changes and control actions
- Network connectivity status
- Error messages for sensor malfunctions

### HC-SR04 Troubleshooting:
1. **No Reading (ERROR displayed)**: 
   - Check power connections (VCC to 5V, GND to GND)
   - Verify trigger and echo pin connections
   - Ensure sensor face is clean and unobstructed

2. **Inaccurate Readings**:
   - Verify tank height constants in code
   - Check sensor mounting (should be vertical, pointing straight down)
   - Ensure stable mounting (vibrations affect readings)

3. **Intermittent Readings**:
   - Check power supply stability
   - Verify wire connections are secure
   - Consider adding capacitors for power filtering

### Common Issues:
1. **WiFi Connection Failed**: Check SSID and password
2. **Sensor Reading Errors**: Verify wiring and power supply
3. **Database Connection Issues**: Ensure internet connectivity
4. **Relay Not Working**: Check relay module power and connections
5. **Tank Level Shows Negative**: Check tank height settings and sensor mounting

## Calibration

### HC-SR04 Calibration:
1. **Empty Tank Test**: 
   - Remove all liquid from tank
   - Note the distance reading (should be close to tank height)
   
2. **Full Tank Test**:
   - Fill tank completely
   - Reading should be close to minimum distance (2-5cm)
   
3. **Adjust Constants**:
   ```cpp
   #define WATER_TANK_HEIGHT 50    // Adjust to your actual tank height
   #define VITAMIN_TANK_HEIGHT 30  // Adjust to your actual tank height
   ```

### Soil Moisture Sensor:
- Test in completely dry soil (should read close to 0%)
- Test in saturated soil (should read close to 100%)
- Adjust mapping in code if readings are off

### Flow Sensor:
- Calibrate flow calculation factor based on your specific sensor
- Default factor is 7.5, adjust based on sensor specifications

## Power Considerations

- **ESP32**: 5V via USB or external supply
- **HC-SR04 Sensors**: 5V power supply (connect VCC to 5V pin)
- **Other Sensors**: Most work with 3.3V from ESP32
- **Pump & Valves**: Typically 12V (use appropriate relay module)
- **Total Current**: Plan for 2-3A total system current

### Power Supply Recommendations:
- Use a 12V 3A power supply for the complete system
- Use DC-DC buck converters to get 5V for ESP32 and sensors
- Add decoupling capacitors near sensors for stable operation
- Consider UPS for critical applications

## System Integration

### Database Integration:
- Tank level data is automatically sent to Supabase
- Invalid readings (sensor errors) send null values
- Historical data tracking for level trends
- Real-time alerts for low tank conditions

### Web Interface:
- Live tank level display with percentage and visual indicators
- Historical charts showing level trends over time
- Low level alert notifications
- Manual system override capabilities

The HC-SR04 upgrade provides significantly more reliable and accurate tank level monitoring compared to analog sensors, enabling better irrigation control and system safety.
