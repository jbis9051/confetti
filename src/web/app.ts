import express from 'express';
import cookieParser from 'cookie-parser';
import deploy from '../deploy/deploy';
import isValidPayload from './isValidPayload';
import { Config } from '../interfaces/Config';
import getBranch from './getBranch';
import { DEFAULT_BRANCH } from '../constants';

export default function createApp(config: Config) {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.post(config.path || '/', (req, res) => {
        if (!req.body) {
            res.status(400).end('Payload empty');
            return;
        }
        const repositoryURL = req.body.repository?.html_url;
        if (!repositoryURL) {
            res.status(400).end('Invalid Payload');
            return;
        }
        const repositoryOptions = config.repositories[repositoryURL];
        if (!repositoryOptions) {
            res.status(404).end('Repository not found');
            return;
        }
        const event = req.header('x-github-event');
        if (!event) {
            res.status(400).end('No event listed');
            return;
        }
        if (event !== 'push') {
            res.status(400).end('Event is not push');
            return;
        }

        try {
            const branch = getBranch(req.body, event);
            if (!branch) {
                res.status(400).end(
                    'Branch name not found. Probably an unsupported event.'
                );
                return;
            }
            const acceptedBranch =
                repositoryOptions.branch || config.branch || DEFAULT_BRANCH;
            if (branch !== acceptedBranch) {
                // 200 is probably not the best code for this but
                // 1. We use 202 for proper requests
                // 2. GitHub doesn't allow users to limit webhooks to branches
                //    so we will receive requests for all branches. We only
                //    want to run on specified branch(s) but we also don't want
                //    to error on something the user can't prevent. So we settle
                //    for a 200.
                res.status(200).send("Branch doesn't match. Skipping.");
            }
            const secret = repositoryOptions.secret || config.secret;
            if (secret) {
                const signature = req.header('x-hub-signature-256');
                if (!signature) {
                    res.status(400).end('Request is not signed');
                    return;
                }
                if (!isValidPayload(req.body, secret, signature)) {
                    res.status(400).end('Signature did not match');
                    return;
                }
            }
            res.status(202).end('Accepted'); // 202 just means it'll be batched for processing
            deploy(repositoryURL, repositoryOptions, config);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            res.status(500).end('Unknown error occurred');
        }
    });
    return app;
}
