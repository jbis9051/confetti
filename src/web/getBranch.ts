export default function getBranch(payload: any, event: string) {
    /*
     GitHub's shitty WebHook API is shitty and doesn't provide us with a consistent or simple way to get the branch
     so we need to do this bullshit. Based on this:
     https://github.com/carlos-jenkins/python-github-webhooks/blob/master/webhooks.py#L113
    */

    /*
    Case 1: a ref_type indicates the type of ref
    This true for create and delete events.
     */
    if (payload.ref_type) {
        if (payload.ref_type === 'branch') {
            return payload.ref;
        }
        return undefined;
    }
    /*
    Case 2: a pull_request object is involved. This is pull_request and
    pull_request_review_comment events.
    */
    if (payload.pull_request) {
        /*
         This is the TARGET branch for the pull-request, not the source
         branch
         */
        return payload.pull_request.base.ref;
    }
    if (event === 'push') {
        // Push events provide a full Git ref in 'ref' and not a 'ref_type'.
        return payload.ref.split('/', 3)[2];
    }
    return undefined;
}
