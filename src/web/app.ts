import express from 'express';
import cookieParser from 'cookie-parser';
import config from '../config';
import deploy from '../deploy/deploy';
import isValidPayload from './isValidPayload';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get(config.path || '/', (req, res, next) => {
    if (!req.body) {
        next('Payload empty');
        return;
    }
    const repositoryURL = req.body.repository.url;
    if(!req.body.repository?.url){
        next('Invalid Payload');
        return;
    }
    const repo = config.repositories[repositoryURL];
    const secret = repo.secret || config.secret;

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
        const secret = repo.secret || config.secret;
        if (!secret) {
            next(
                'Could not find secret for specified repository. Please check your configuration'
            );
            return;
        }
        if (!isValidPayload(req.body, secret, signature)) {
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
