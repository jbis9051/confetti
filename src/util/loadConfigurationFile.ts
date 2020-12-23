import fse from 'fs-extra';
import yaml from 'js-yaml';
import { ConfettiConfiguration } from '../interfaces/ConfettiConfiguration';

export default function loadConfigurationFile(filePath: string) {
    return yaml.safeLoad(
        fse.readFileSync(filePath).toString()
    ) as ConfettiConfiguration;
}
