# COSCUP Events

COSCUP Events is a planned hub for upcoming COSCUP activities. It will bring together event descriptions, dates, locations, related information, and registration links so participants can quickly find events to join.

The project is planned as a static website deployed with GitHub Pages. Registration will take place on each event's external registration page.

## Project status

The project is in its initial stage. Only this project overview is available; the website, event data, technology stack, and deployment workflow have yet to be implemented.

- Repository: [COSCUP/events](https://github.com/COSCUP/events)
- Deployment target: GitHub Pages

## Planned features

- A list of upcoming events with their names, descriptions, dates, and locations.
- Event information and external registration links.
- Event and registration statuses, such as registration open, registration closed, ended, or cancelled.
- Layouts suitable for mobile and desktop browsers.

## Event data

Each event should include the information below. The storage format and file locations will be decided during implementation.

| Field | Description |
| --- | --- |
| Event name | Full public name of the event |
| Description | Topic, content, and intended audience |
| Date and time | Start and end times with a time zone; use `Asia/Taipei` for events in Taiwan |
| Location | Physical venue and address, or instructions for joining online |
| Event status | Whether the event is scheduled, ended, or cancelled |
| Registration | Registration link, deadline, and status; clearly state when registration is not required |
| Related links | Event website, detailed information, or organizer announcements |
| Image | Optional image that may be publicly displayed, with alternative text |

When updating events, check the organizer's announcements to confirm dates, locations, and links. Update the displayed status when an event changes or ends, or when registration closes.

## Getting the project

```bash
git clone https://github.com/COSCUP/events.git
cd events
```

There is no runnable website, package installation, or start command yet. Development setup, local preview, and build instructions will be added once the technology stack is chosen.

## GitHub Pages deployment plan

After the website is implemented, configure deployment according to the build approach:

1. Set the publishing source under **Settings → Pages** in the repository.
2. For static files that do not require a build, choose **Deploy from a branch** and select the publishing branch and site directory (the root directory or `/docs`).
3. For a site that requires a build, choose **GitHub Actions** and create a workflow to build and publish the static output.

See the [GitHub Pages documentation on configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). This repository does not yet contain deployment configuration.

Without a custom domain, the expected project site URL is [https://coscup.github.io/events/](https://coscup.github.io/events/), according to the [GitHub Pages URL rules](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). The actual URL depends on the Pages settings. During implementation, account for the `/events/` base path in page links and static asset paths, and verify images, styles, and registration links after deployment.
