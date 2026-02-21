import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(settings) {
            super._init(0.0, 'Caps/Num Lock Indicator');

            this._settings = settings;

            this._box = new St.BoxLayout({
                style_class: 'panel-status-indicators-box',
            });

            // Holders for the visual elements
            this._capsWidget = null;
            this._numWidget = null;

            this._setupWidgets();

            this.add_child(this._box);

            this._seat = Clutter.get_default_backend().get_default_seat();
            this._keymap = this._seat.get_keymap();

            // Menu items
            this._capsSwitch = new PopupMenu.PopupSwitchMenuItem('Caps Lock', false);
            this._capsSwitch.connect('toggled', this._toggleCapsLock.bind(this));
            this.menu.addMenuItem(this._capsSwitch);

            this._numSwitch = new PopupMenu.PopupSwitchMenuItem('Num Lock', false);
            this._numSwitch.connect('toggled', this._toggleNumLock.bind(this));
            this.menu.addMenuItem(this._numSwitch);

            // Listen for keyboard state changes (Caps Lock, Num Lock)
            this._keymapStateChangedId = this._keymap.connect('state-changed', this._syncState.bind(this));

            // Listen for settings changes
            this._settingsChangedId = this._settings.connect('changed', this._onSettingsChanged.bind(this));

            // Initial state sync
            this._syncState();
        }

        _setupWidgets() {
            if (this._capsWidget) {
                this._capsWidget.destroy();
            }
            if (this._numWidget) {
                this._numWidget.destroy();
            }

            const useIcons = this._settings.get_boolean('use-icons');

            if (useIcons) {
                this._capsWidget = new St.Icon({
                    icon_name: 'changes-prevent-symbolic', // A lock icon
                    style_class: 'system-status-icon capsnum-indicator'
                });
                this._numWidget = new St.Icon({
                    icon_name: 'input-keyboard-symbolic', // Alternative icon
                    style_class: 'system-status-icon capsnum-indicator'
                });
            } else {
                this._capsWidget = new St.Label({
                    text: 'A',
                    y_align: Clutter.ActorAlign.CENTER,
                    style_class: 'capsnum-indicator'
                });
                this._numWidget = new St.Label({
                    text: '1',
                    y_align: Clutter.ActorAlign.CENTER,
                    style_class: 'capsnum-indicator'
                });
            }

            this._box.add_child(this._capsWidget);
            this._box.add_child(this._numWidget);
        }

        _onSettingsChanged() {
            // If settings changed, we might need to recreate widgets (Text vs Icon)
            this._setupWidgets();
            this._syncState();
        }

        _toggleCapsLock(menuItem, state) {
            // Toggle the state artificially if the menu switch is clicked
            // Note: Wayland security restricts artificial key presses in some contexts, but this may work depending on the compositor/X11
            // Usually, a more robust way is to invoke a DBus method, but simple toggle isn't natively exposed via Keymap reliably.
            // We will try to simulate a key press if we can, or we just rely on it working under X11.
            // Actually, simulating key events in GNOME 45+ Wayland is very restricted. 
            // A safer way is to just let the user know they toggled it.
            // For now, we will leave the toggle switch to just reflect state and act as a visual hint, 
            // as injecting key events requires `gnome-remote-desktop` DBus or `wtype` due to Wayland security.

            // For this demo, we can just sync state back because we can't reliably inject keys in pure gjs on Wayland without extensions.
            // We revert the switch state if it was toggled by the user directly.
            this._syncState();
        }

        _toggleNumLock(menuItem, state) {
            this._syncState();
        }

        _syncState() {
            let capsState = this._keymap.get_caps_lock_state();
            let numState = this._keymap.get_num_lock_state();
            let showCaps = this._settings.get_boolean('show-caps-lock');
            let showNum = this._settings.get_boolean('show-num-lock');
            let hideWhenOff = this._settings.get_boolean('hide-when-off');

            // Update popup menu switches
            if (this._capsSwitch) this._capsSwitch.setToggleState(capsState);
            if (this._numSwitch) this._numSwitch.setToggleState(numState);

            // Update Caps Widget
            if (showCaps) {
                if (capsState) {
                    this._capsWidget.show();
                    this._capsWidget.add_style_class_name('capsnum-indicator-on');
                    this._capsWidget.remove_style_class_name('capsnum-indicator-off');
                } else {
                    if (hideWhenOff) {
                        this._capsWidget.hide();
                    } else {
                        this._capsWidget.show();
                        this._capsWidget.add_style_class_name('capsnum-indicator-off');
                        this._capsWidget.remove_style_class_name('capsnum-indicator-on');
                    }
                }
            } else {
                this._capsWidget.hide();
            }

            // Update Num Widget
            if (showNum) {
                if (numState) {
                    this._numWidget.show();
                    this._numWidget.add_style_class_name('capsnum-indicator-on');
                    this._numWidget.remove_style_class_name('capsnum-indicator-off');
                } else {
                    if (hideWhenOff) {
                        this._numWidget.hide();
                    } else {
                        this._numWidget.show();
                        this._numWidget.add_style_class_name('capsnum-indicator-off');
                        this._numWidget.remove_style_class_name('capsnum-indicator-on');
                    }
                }
            } else {
                this._numWidget.hide();
            }

            // Hide entire indicator if both are hidden
            if (!this._capsWidget.visible && !this._numWidget.visible) {
                this.hide();
            } else {
                this.show();
            }
        }

        destroy() {
            if (this._keymapStateChangedId) {
                this._keymap.disconnect(this._keymapStateChangedId);
                this._keymapStateChangedId = null;
            }
            if (this._settingsChangedId) {
                this._settings.disconnect(this._settingsChangedId);
                this._settingsChangedId = null;
            }
            super.destroy();
        }
    });

export default class CapsNumExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this.getSettings());
        Main.panel.addToStatusArea('capsnum-indicator', this._indicator, 1, 'right');
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
