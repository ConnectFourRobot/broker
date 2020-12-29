import SerialPort from 'serialport'

export default class Connector {
    private timeOut: number = 10000;
    private retryCount: number = 8;
    private currentRetryCount: number = 8;
    private serialPort: SerialPort;

    constructor(serialPort: SerialPort, timeOut: number = 10000, retryCount: number = 8){
        this.timeOut = timeOut;
        this.retryCount = retryCount;
        this.currentRetryCount = retryCount;
        this.serialPort = serialPort;
    }

    public openPort() {
        this.serialPort.open(err => {
            if (err) {
                console.log('Error opening port: ', err.message)
                if(this.currentRetryCount > 0) {
                    this.reconnect();
                } else {
                    console.log('Cannot open port, please restart the service.');
                    return;
                }
            } else {
                console.log('Serial connection established.');
                this.currentRetryCount = this.retryCount;
            }
        })
    }
    
    private reconnect() {
        console.log('Initiating reconnect.');
        setTimeout(() => {
          console.log('Reconnecting...');
          this.openPort();
          this.currentRetryCount--;
        }, this.timeOut);
    };     
}