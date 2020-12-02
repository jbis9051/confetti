import yaml from 'js-yaml';
import fse from 'fs-extra';
import { Config } from './interfaces/Config';

export default yaml.safeLoad(
    fse.readFileSync('/etc/confetti-conf.yml').toString()
) as Config;
