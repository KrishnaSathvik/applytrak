export async function sendWelcomeEmail(email: string, name: string) {
    try {
        await fetch("/functions/v1/welcome-email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, name}),
        });
    } catch (err) {
        console.error("Failed to send welcome email:", err);
    }
}