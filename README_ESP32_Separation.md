
# ESP32 Smart Irrigation System - Separated Architecture

## Overview
The system is now separated into two distinct ESP32 modules for better modularity and performance:

### 1. ESP32 Irrigation Controller (`esp32_irrigation_system.ino`)
**Purpose**: Main irrigation control and sensor monitoring
**Hardware**: Standard ESP32 Dev Board

**Features**:
- Environmental sensor monitoring (DHT22, BH1750, Soil moisture)
- Tank level monitoring (Water & Vitamin tanks)
- Temperature monitoring (DS18B20 sensors)
- Flow rate measurement
- Automated irrigation control
- Fan control for temperature regulation
- Data logging to Supabase database
- Manual device control via web interface

**Sensors Connected**:
- DHT22 (Pin 4) - Temperature & Humidity
- BH1750 (I2C) - Light level
- Soil Moisture (A0) - Analog sensor
- Water Tank Level (A1) - Analog sensor
- Vitamin Tank Level (A2) - Analog sensor
- DS18B20 (Pin 2) - Water & Vitamin temperature
- Flow Sensor (Pin 3) - Water flow measurement

**Actuators**:
- Water Pump (Pin 5)
- Cooling Fan (Pin 6)

### 2. ESP32 CAM Module (`esp32_cam_monitoring.ino`)
**Purpose**: Visual monitoring and surveillance
**Hardware**: ESP32-CAM (AI-Thinker model recommended)

**Features**:
- Live video streaming
- Snapshot capture
- Web-based camera interface
- Remote camera settings adjustment
- Status reporting to main system
- Multiple camera endpoints

**Web Endpoints**:
- `/stream` - Live MJPEG stream
- `/capture` - Single image capture
- `/status` - Camera status and statistics
- `/settings` - Camera configuration (POST)

## Network Architecture

```
Internet/Local Network
        |
    WiFi Router
    /         \
ESP32-CAM    ESP32-Main
(Monitor)    (Control)
   |            |
Camera      Sensors+Pumps
```

Both ESP32 modules connect to the same WiFi network and communicate with:
- Supabase database for data storage
- Web dashboard for user interface
- Each other for coordination (optional)

## Setup Instructions

### ESP32 Main Controller Setup:
1. Upload `esp32_irrigation_system.ino` to standard ESP32 board
2. Connect all sensors according to pin definitions
3. Update WiFi credentials and Supabase configuration
4. Verify sensor readings in Serial Monitor

### ESP32-CAM Setup:
1. Upload `esp32_cam_monitoring.ino` to ESP32-CAM module
2. Include `camera_pins.h` in the same folder
3. Update WiFi credentials and Supabase configuration
4. Access camera stream at `http://[ESP32-CAM-IP]/stream`

## Configuration

### WiFi Settings (both modules):
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### Supabase Settings (both modules):
```cpp
const char* supabaseUrl = "https://your-project.supabase.co";
const char* supabaseKey = "your-anon-key";
```

## IP Address Management

After uploading, both modules will display their IP addresses:
- ESP32 Main: Usually gets first available IP
- ESP32-CAM: Gets next available IP

Note these IPs and update the web dashboard camera configuration accordingly.

## Advantages of Separation

1. **Performance**: Each ESP32 focuses on specific tasks
2. **Reliability**: Camera issues don't affect irrigation control
3. **Scalability**: Easy to add more camera modules
4. **Maintenance**: Independent updates and troubleshooting
5. **Resource Management**: Better memory and processing allocation

## Troubleshooting

### ESP32 Main Issues:
- Check sensor connections
- Verify pump/fan wiring
- Monitor serial output for errors
- Test individual sensor readings

### ESP32-CAM Issues:
- Ensure adequate power supply (5V recommended)
- Check camera module connection
- Verify PSRAM availability
- Test camera endpoints individually

### Network Issues:
- Confirm both modules connect to WiFi
- Check IP address conflicts
- Verify Supabase connectivity
- Test database permissions

## Future Enhancements

- Inter-ESP32 communication protocol
- Automatic IP discovery
- Camera motion detection integration
- Multiple camera support
- Enhanced error handling and recovery
- OTA (Over-The-Air) updates for both modules
