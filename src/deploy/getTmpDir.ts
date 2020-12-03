import fse from 'fs-extra';
import os from 'os';
import { sep } from 'path';

export default function getTmpDir() {
    return fse.mkdtemp(`${os.tmpdir()}${sep}`);
}
