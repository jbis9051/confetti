import fse from 'fs-extra';
import os from 'os';
import { sep } from 'path';

export default function createTmpDir() {
    return fse.mkdtemp(`${os.tmpdir()}${sep}`);
}
