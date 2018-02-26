class Droplet {
  constructor() {

  }
  set name(name) {
    this._name = name
  }
  get name() {
    return this._name
  }
  set region(region) {
    this._region = region
  }
  get region() {
    return this._region
  }
  set size(size) {
    this._size = size
  }
  get size() {
    return this._size
  }
  set image(image) {
    this._image = image
  }
  get image() {
    return this._image
  }
  set sshKeys(sshkeys) {
    this._sshkeys = sshkeys
  }
  get sshKeys() {
    return this._sshKeys
  }
  set backups(enableBackups) {
    this._backups = enableBackups
  }
  get backups() {
    return this._backups
  }
  set ipv6(isIPv6) {
    this._ipv6 = isIPv6
  }
  get ipv6() {
    return this._ipv6
  }
  set privateNetworking(enablePrivateNetwork) {
    this._privateNetworking = enablePrivateNetwork
  }
  get privateNetworking() {
    return this._privateNetworking
  }
  set userData(userData) {
    this._userData = userData
  }
  get userData() {
    return this._userData
  }
  set monitoring(enableMonitoring) {
    this._monitoring = enableMonitoring
  }
  get monitoring() {
    return this._monitoring
  }
  set volumes(volumes) {
    this._volumes = volumes
  }
  get volumes() {
    return this._volumes
  }
  set tags(tags) {
    this._tags = tags
  }
  get tags() {
    return this._tags
  }

  toJSON() {
    return {
      name: this._name,
      region: this._region,
      size: this._size,
      image: this._image,
      ssh_keys: this._sshkeys,
      backups: this._backups,
      ipv6: this._ipv6,
      private_networking: this._privateNetworking,
      user_data: this._userData,
      monitoring: this._monitoring,
      volumes: this._volumes,
      tags: this._tags
    };
  }
}
module.exports = Droplet