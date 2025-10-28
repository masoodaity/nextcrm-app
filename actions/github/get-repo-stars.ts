import axios, { AxiosResponse } from "axios";

export default async function getGithubRepoStars(): Promise<number> {
  try {
    const url =
      process.env.NEXT_PUBLIC_GITHUB_REPO_API ||
      "https://api.github.com/repos/pdovhomilja/nextcrm-app";

    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token && token.trim().length > 0) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response: AxiosResponse<any> = await axios.get(url, { headers });
    //console.log(response, "response");
    const stars = response.data;
    //console.log(stars.stargazers_count);
    return stars.stargazers_count;
  } catch (error) {
    console.error("Error fetching commits:", error);
    return 0;
  }
}
