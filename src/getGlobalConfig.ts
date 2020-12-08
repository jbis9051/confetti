import yaml from 'js-yaml';
import fse from 'fs-extra';
import { ConfettiConfiguration } from './interfaces/ConfettiConfiguration';
import { CONFETTI_CONFIG_PATH } from './constants';

export default function getGlobalConfig() {
    if (!fse.existsSync(CONFETTI_CONFIG_PATH)) {
        throw new Error(
            `Config not found at '${CONFETTI_CONFIG_PATH}'. Run 'sudo confetti init'`
        );
    }
    return yaml.safeLoad(
        fse.readFileSync(CONFETTI_CONFIG_PATH).toString()
    ) as ConfettiConfiguration;
}
