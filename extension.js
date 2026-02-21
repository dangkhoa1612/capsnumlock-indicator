import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Caps/Num Lock Indicator');

        this._box = new St.BoxLayout({
            style_class: 'panel-status-indicators-box',
        });

        // Caps Lock Label
        this._capsLabel = new St.Label({
            text: 'A',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'capsnum-indicator'
        });

        // Num Lock Label
        this._numLabel = new St.Label({
            text: '1',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'capsnum-indicator'
        });

        this._box.add_child(this._capsLabel);
        this._box.add_child(this._numLabel);
        
        this.add_child(this._box);

        this._seat = Clutter.get_default_backend().get_default_seat();
        this._keymap = this._seat.get_keymap();

        // Listen for keyboard state changes (Caps Lock, Num Lock)
        this._keymapStateChangedId = this._keymap.connect('state-changed', this._syncState.bind(this));
        
        // Initial state sync
        this._syncState();
    }

    _syncState() {
        let capsState = this._keymap.get_caps_lock_state();
        let numState = this._keymap.get_num_lock_state();

        if (capsState) {
            this._capsLabel.add_style_class_name('capsnum-indicator-on');
            this._capsLabel.remove_style_class_name('capsnum-indicator-off');
        } else {
            this._capsLabel.add_style_class_name('capsnum-indicator-off');
            this._capsLabel.remove_style_class_name('capsnum-indicator-on');
        }

        if (numState) {
            this._numLabel.add_style_class_name('capsnum-indicator-on');
            this._numLabel.remove_style_class_name('capsnum-indicator-off');
        } else {
            this._numLabel.add_style_class_name('capsnum-indicator-off');
            this._numLabel.remove_style_class_name('capsnum-indicator-on');
        }
    }

    destroy() {
        if (this._keymapStateChangedId) {
            this._keymap.disconnect(this._keymapStateChangedId);
            this._keymapStateChangedId = null;
        }
        super.destroy();
    }
});

export default class CapsNumExtension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea('capsnum-indicator', this._indicator, 1, 'right');
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
