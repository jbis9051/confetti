import fse from 'fs-extra';
import { CONFETTI_CONFIG_PATH } from './constants';
import loadConfigurationFile from './loadConfigurationFile';

export default function getGlobalConfig() {
    if (!fse.existsSync(CONFETTI_CONFIG_PATH)) {
        throw new Error(
            `Config not found at '${CONFETTI_CONFIG_PATH}'. Run 'sudo confetti init'`
        );
    }
    return loadConfigurationFile(CONFETTI_CONFIG_PATH);
}
