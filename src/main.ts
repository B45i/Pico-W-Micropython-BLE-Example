import './style.css';

class BLEApp {
    // org.bluetooth.service.environmental_sensing
    readonly bleServiceId = 'environmental_sensing';

    // org.bluetooth.characteristic.temperature
    readonly temperatureCharacteristicId = 'temperature';

    bleDevice: BluetoothDevice | undefined = undefined;

    temperatureCharacteristic: BluetoothRemoteGATTCharacteristic | undefined =
        undefined;

    tempChangeCallback: Function | undefined = undefined;

    get isConnected(): boolean {
        return !!this.bleDevice;
    }

    async start(callback: Function) {
        if (!navigator.bluetooth) {
            console.error('Web BLE not supported');
            return;
        }

        this.tempChangeCallback = callback;

        try {
            await this.getDevice();
            await this.connect();
        } catch (error) {
            console.log(error);
        }
    }

    private async getDevice() {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [0x181a] }],
        });

        console.log({ device });
        this.bleDevice = device;
    }

    private async connect() {
        if (!this.bleDevice) {
            return;
        }

        const server = await this.bleDevice.gatt?.connect();
        const service = await server?.getPrimaryService(this.bleServiceId);
        const characteristic = await service?.getCharacteristic(
            this.temperatureCharacteristicId
        );

        this.temperatureCharacteristic = characteristic;

        console.log(this.temperatureCharacteristic);

        this.temperatureCharacteristic?.addEventListener(
            'characteristicvaluechanged',
            this.handleChangedValue.bind(this)
        );

        this.temperatureCharacteristic?.startNotifications();
    }

    handleChangedValue(event: any) {
        const value = event.target.value.getUint8(0);
        if (this.tempChangeCallback) {
            this.tempChangeCallback(value);
        }
    }
}

const getDeviceBtn = document.querySelector('#getDeviceBtn');
const temperature = document.querySelector('#temperature');

const updateValue = (value: any) => {
    temperature!.textContent = value;
    console.log(value);
};

getDeviceBtn?.addEventListener('click', () => {
    const app = new BLEApp();
    app.start(updateValue);
    getDeviceBtn.classList.add('hide');
    temperature?.classList.remove('hide');
});
