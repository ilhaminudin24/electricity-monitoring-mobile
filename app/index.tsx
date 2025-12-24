import { Redirect } from 'expo-router';

export default function Index() {
    // Simply redirect to login page
    // The _layout.tsx will handle auth state and redirect to tabs if authenticated
    return <Redirect href="/(auth)/login" />;
}
