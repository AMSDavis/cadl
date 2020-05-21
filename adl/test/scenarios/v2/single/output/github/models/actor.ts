
/**
 * @description A user or organization
 */
export interface actor {
    avatar_url: string;
    bio: string;
    /**
     * @description The website URL from the profile page
     */
    blog: string;
    collaborators: int64;
    company: string;
    /**
     * @description ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
     */
    created_at: string;
    disk_usage: int64;
    /**
     * @description Note: The returned email is the user’s publicly visible email address (or null if the user has not specified a public email address in their profile).
     */
    email: string;
    followers: int64;
    followers_url: string;
    following: int64;
    following_url: string;
    gists_url: string;
    gravatar_id: string;
    hireable: boolean;
    html_url: string;
    id: int64;
    location: string;
    /**
     * @description The account username
     */
    login: string;
    /**
     * @description The full account name
     */
    name: string;
    organizations_url: string;
    owned_private_repos: int64;
    plan: {
        collaborators: int64;
        name: string;
        private_repos: int64;
        space: int64;
    };
    private_gists: int64;
    public_gists: int64;
    public_repos: int64;
    starred_url: string;
    subscriptions_url: string;
    total_private_repos: int64;
    type: "User" | "Organization";
    /**
     * @description ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
     */
    updated_at: string;
    url: string;
}
