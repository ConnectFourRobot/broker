import serial.tools.list_ports

def findPortBySerialNumber(serialNumber: str) -> str:
    ports = list(serial.tools.list_ports.comports())
    for port in ports:
        if serialNumber == port.serial_number:
            return port[0]