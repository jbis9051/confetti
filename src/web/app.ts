import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import config from '../config';
import deploy from '../deploy/deploy';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function isValidPayload(payload: string, secret: string, signature: string) {
    // based off of https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(
        `sha256=${hmac.update(payload).digest('hex')}`,
        'utf8'
    );
    const checksum = Buffer.from(signature);
    return (
        checksum.length === digest.length &&
        crypto.timingSafeEqual(digest, checksum)
    );
}

app.get('/payload', (req, res, next) => {
    const payloadString = JSON.stringify(req.body);
    if (!payloadString) {
        next('Payload empty');
        return;
    }
    const signature = req.header('x-hub-signature-256');
    if (!signature) {
        next('Signature Missing');
        return;
    }
    const event = req.header('x-github-event');
    if (!event) {
        next('No event listed');
        return;
    }
    if (event !== 'push') {
        next('Event is not push');
        return;
    }
    try {
        const repositoryURL = req.body.repository.url;
        const repo = config.repositories[repositoryURL];
        const secret = repo.secret || config.secret;
        if (!secret) {
            next(
                'Could not find secret for specified repository. Please check your configuration'
            );
            return;
        }
        if (!isValidPayload(payloadString, secret, signature)) {
            next('Signature did not match');
            return;
        }
        res.end('Ok');
        deploy(repositoryURL, repo);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        next('Error occurred');
    }
});

export default app;
