import readline from 'readline';

export default function askQuestion(query: string) {
    // https://stackoverflow.com/a/50890409/7886229
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}
