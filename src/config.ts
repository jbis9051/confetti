import yaml from 'js-yaml';
import fse from 'fs-extra';
import { Config } from './interfaces/Config';
import { CONFETTI_CONFIG_PATH } from './constants';

// we need to do this crap so we can mock the config file

let config: Config;

export function setConfig(newConfig: Config) {
    config = newConfig;
}

export default function getConfig() {
    if (!config) {
        setConfig(
            yaml.safeLoad(
                fse.readFileSync(CONFETTI_CONFIG_PATH).toString()
            ) as Config
        );
    }
    return config;
}
