'use strict';

const { Device } = require('homey');
const P1ibConnector = require('./p1ib');

class P1ibDevice extends Device {

  async onInit() {
    this.log('p1ib has been initialized');

    const settings = this.getSettings();
    console.log('p1ib address:', settings.p1ib_address);

    this.p1ibConnector = new P1ibConnector(settings.p1ib_address);
    await this.update();

    this.pollTimeout = this.homey.setInterval(async () => {
      await this.update();
    }, 10000);
  }

  async update() {
    try {
      const meterData = await this.p1ibConnector.readMeterData();
      this.log(meterData);

      this.setCapabilityValue('measure_power', meterData.momentaryPowerImport).catch(this.error);
      this.setCapabilityValue('measure_power.export', meterData.momentaryPowerExport * -1).catch(this.error);

      this.setCapabilityValue('meter_power', meterData.activeImport).catch(this.error);

      this.setCapabilityValue('measure_current.l1', meterData.currentL1).catch(this.error);
      this.setCapabilityValue('measure_current.l2', meterData.currentL2).catch(this.error);
      this.setCapabilityValue('measure_current.l3', meterData.currentL3).catch(this.error);

      this.setCapabilityValue('measure_voltage.l1', meterData.voltageL1).catch(this.error);
      this.setCapabilityValue('measure_voltage.l2', meterData.voltageL2).catch(this.error);
      this.setCapabilityValue('measure_voltage.l3', meterData.voltageL3).catch(this.error);

      this.setAvailable().catch(this.error);
    } catch (error) {
      console.error('error:', error);
      this.setUnavailable().catch(this.error);
    }
  }

  async onAdded() {
    this.log('p1ib has been added');
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('p1ib settings were changed');
    this.p1ibConnector.address = newSettings.p1ib_address;
  }

  async onRenamed(name) {
    this.log('p1ib was renamed');
  }

  async onDeleted() {
    this.log('p1ib has been deleted');
    this.homey.clearInterval(this.pollTimeout);
  }

  onDiscoveryResult(discoveryResult) {
    // Return a truthy value here if the discovery result matches your device.

    console.log('onDiscoveryResult:', discoveryResult);

    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    console.log('onDiscoveryAvailable:', discoveryResult);
  }

  async onDiscoveryAddressChanged(discoveryResult) {
    console.log('onDiscoveryAddressChanged');

    this.homey.clearInterval(this.pollTimeout);

    const p1ibAddress = `${discoveryResult.address}:${discoveryResult.port}`;

    await this.setSettings({
      p1ib_address: p1ibAddress,
    });

    this.p1ibConnector.address = p1ibAddress;
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    console.log('onDiscoveryLastSeenChanged');
  }

}

module.exports = P1ibDevice;
