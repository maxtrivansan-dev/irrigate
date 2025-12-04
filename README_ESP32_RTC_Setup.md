
# ESP32 Smart Irrigation System with RTC and Database Integration

## Overview
This enhanced version of the ESP32 irrigation system includes Real-Time Clock (RTC) functionality for scheduled irrigation and automatic synchronization with the Supabase database for thresholds and irrigation schedules.

## New Hardware Requirements

### Additional Components:
- **DS3231 RTC Module** (I2C interface)
- **CR2032 Battery** for RTC backup power
- **2x Solenoid Valves** for water and vitamin tank control
- **Jumper wires** for additional connections

### Updated Pin Connections:

```
ESP32 Pin -> Component
GPIO 4    -> DHT22 Data Pin
GPIO 34   -> Soil Moisture Sensor Analog Output
GPIO 2    -> DS18B20 Temperature Sensors (Water & Vitamin tanks)
GPIO 3    -> Water Flow Sensor Input
GPIO 5    -> Water Pump Relay Control
GPIO 6    -> Fan Relay Control
GPIO 7    -> Water Tank Valve Relay Control
GPIO 8    -> Vitamin Tank Valve Relay Control

// HC-SR04 Ultrasonic Sensors for Tank Level Monitoring
GPIO 18   -> Water Tank HC-SR04 Trigger Pin
GPIO 19   -> Water Tank HC-SR04 Echo Pin
GPIO 25   -> Vitamin Tank HC-SR04 Trigger Pin
GPIO 26   -> Vitamin Tank HC-SR04 Echo Pin

// I2C for BH1750 Light Sensor and DS3231 RTC
GPIO 21   -> SDA (I2C Data)
GPIO 22   -> SCL (I2C Clock)
```

## Software Setup

### 1. Required Libraries:
Install these libraries in Arduino IDE:
- `DHT sensor library` by Adafruit
- `ArduinoJson` by Benoit Blanchon
- `OneWire` by Jim Studt
- `DallasTemperature` by Miles Burton
- `BH1750` by Christopher Laws
- `RTClib` by Adafruit (NEW)
- `HTTPClient` (included with ESP32 package)

### 2. RTC Module Setup:
1. **Connect DS3231 to ESP32:**
   - VCC -> 3.3V or 5V
   - GND -> GND
   - SDA -> GPIO 21
   - SCL -> GPIO 22

2. **Insert CR2032 battery** into the DS3231 module for backup power

3. **Initial time setting:** The RTC will automatically set the time from compilation time on first upload

## New Features

### 1. Database Threshold Synchronization
- **Automatic sync** every 5 minutes from `thresholds` table
- **Dynamic threshold updates** without code recompilation
- **Configurable parameters:**
  - Maximum temperature for fan activation
  - Minimum soil moisture for irrigation
  - Low water/vitamin tank level alerts
  - Minimum light level monitoring

### 2. Scheduled Irrigation System
- **Time-based irrigation** using RTC module
- **Database-driven schedule** from `irrigation_schedule` table
- **Configurable features:**
  - Morning and evening irrigation times
  - Weekend mode enable/disable
  - Tank rotation for balanced usage
  - Schedule enable/disable functionality

### 3. Enhanced Valve Control
- **Separate water and vitamin valves**
- **Tank selection logic** for irrigation
- **Tank rotation system** for balanced usage
- **Safety interlocks** prevent simultaneous valve operation

## Database Integration

### Thresholds Table Structure:
```sql
- max_temperature: Maximum temperature before fan activation
- min_soil_moisture: Minimum soil moisture before irrigation
- low_water_level: Water tank low level alert threshold
- low_vitamin_level: Vitamin tank low level alert threshold
- min_light_level: Minimum light level monitoring
```

### Irrigation Schedule Table Structure:
```sql
- enabled: Enable/disable scheduled irrigation
- morning_time: Morning irrigation time (HH:MM:SS)
- evening_time: Evening irrigation time (HH:MM:SS)
- weekend_mode: Enable irrigation on weekends
- tank_rotation: Alternate between water/vitamin tanks
```

## System Operation

### 1. Automatic Threshold Updates:
- System syncs thresholds every 5 minutes
- Changes in database immediately affect system behavior
- No code recompilation required for threshold adjustments

### 2. Scheduled Irrigation Logic:
```
1. Check if schedule is enabled
2. Verify current time matches scheduled time
3. Check weekend mode if applicable
4. Verify tank levels are adequate
5. Select appropriate tank (rotation or preference)
6. Execute irrigation cycle
7. Log irrigation event to database
```

### 3. Tank Selection Algorithm:
- **Tank Rotation Mode:** Alternates between water and vitamin tanks
- **Availability Check:** Uses available tank if primary is low
- **Safety Override:** Blocks irrigation if both tanks are critically low
- **Preference System:** Defaults to water tank when both available

## Configuration

### 1. Time Synchronization:
The RTC automatically sets time from compilation timestamp on first upload. For accurate time:
```cpp
// Manual time setting (if needed)
rtc.adjust(DateTime(2024, 1, 15, 14, 30, 0)); // Year, Month, Day, Hour, Min, Sec
```

### 2. Threshold Database Setup:
Ensure your `thresholds` table has at least one record:
```sql
INSERT INTO thresholds (max_temperature, min_soil_moisture, low_water_level, low_vitamin_level, min_light_level)
VALUES (35.0, 42.0, 20.0, 15.0, 300.0);
```

### 3. Schedule Database Setup:
Set up your irrigation schedule:
```sql
INSERT INTO irrigation_schedule (enabled, morning_time, evening_time, weekend_mode, tank_rotation)
VALUES (true, '08:00:00', '18:00:00', true, true);
```

## Monitoring and Control

### Serial Monitor Output:
```
=== Thresholds Updated ===
Max Temperature: 35.0°C
Min Soil Moisture: 42.0%
Low Water Level: 20.0%
Low Vitamin Level: 15.0%
Min Light Level: 300.0 lux

=== Schedule Updated ===
Enabled: YES
Morning: 08:00
Evening: 18:00
Weekend Mode: YES
Tank Rotation: YES

RTC Time: 14:25:30
=== Scheduled Morning Irrigation ===
IRRIGATION STARTED (Water Tank): Morning scheduled irrigation
```

### Real-time Control:
- Manual device control still available through database
- Auto mode can be overridden for manual operation
- Individual valve control for maintenance
- Real-time status monitoring

## Troubleshooting

### RTC Issues:
1. **RTC not found:** Check I2C connections (SDA/SCL)
2. **Time reset:** Replace CR2032 battery
3. **Wrong time:** Manually adjust using `rtc.adjust()`

### Database Sync Issues:
1. **No threshold updates:** Check WiFi connectivity
2. **Schedule not working:** Verify database table structure
3. **Sync errors:** Monitor serial output for HTTP response codes

### Valve Control Issues:
1. **Valves not switching:** Check relay module power and connections
2. **Both valves active:** Review control logic, should be mutually exclusive
3. **No irrigation:** Verify tank levels and threshold settings

## Benefits

### 1. Automated Operation:
- No manual intervention required for daily irrigation
- Intelligent tank management and rotation
- Dynamic threshold adjustments without code changes

### 2. Data-Driven Control:
- All parameters stored in database
- Easy configuration through web interface
- Historical logging for system optimization

### 3. Enhanced Reliability:
- RTC maintains accurate time during power outages
- Battery backup ensures schedule continuity
- Multiple safety checks prevent system damage

### 4. Scalability:
- Easy to add more irrigation zones
- Database-driven configuration allows remote management
- Modular design supports additional sensors/actuators

This enhanced system provides a complete, professional-grade irrigation solution with database integration, scheduled operation, and intelligent tank management.
