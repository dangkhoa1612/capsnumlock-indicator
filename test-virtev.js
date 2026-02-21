const { Clutter, GObject } = imports.gi;
const getSeat = Clutter.get_default_backend().get_default_seat();
console.log(getSeat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE));
