import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class IndicatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page and group
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: _('Indicator Behavior'),
            description: _('Configure how the Caps Lock and Num Lock indicators are displayed.'),
        });
        page.add(group);

        // Get the GSettings schema
        const settings = this.getSettings('org.gnome.shell.extensions.capsnum-indicator');

        // Create switch rows linked to settings keys
        const createSwitch = (title, subtitle, key) => {
            const row = new Adw.ActionRow({ title, subtitle });
            const toggle = new Adw.SwitchRow();

            // Connect switch to GSettings
            settings.bind(key, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
            return toggle;
        };

        const showCapsRow = new Adw.SwitchRow({
            title: _('Show Caps Lock'),
            subtitle: _('Display the Caps Lock indicator in the top panel.')
        });
        settings.bind('show-caps-lock', showCapsRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showNumRow = new Adw.SwitchRow({
            title: _('Show Num Lock'),
            subtitle: _('Display the Num Lock indicator in the top panel.')
        });
        settings.bind('show-num-lock', showNumRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const hideWhenOffRow = new Adw.SwitchRow({
            title: _('Hide when inactive'),
            subtitle: _('Hide the indicator completely when the lock is turned off, rather than fading it.')
        });
        settings.bind('hide-when-off', hideWhenOffRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const useIconsRow = new Adw.SwitchRow({
            title: _('Use system icons'),
            subtitle: _('Display lock icons instead of text labels ("A" and "1").')
        });
        settings.bind('use-icons', useIconsRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        group.add(showCapsRow);
        group.add(showNumRow);
        group.add(hideWhenOffRow);
        group.add(useIconsRow);

        window.add(page);
    }
}
