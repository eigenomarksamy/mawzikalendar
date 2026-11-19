// Text as it comes from copying an ra.co event page: a breadcrumb, the title, then
// labelled blocks, each label and value on its own line. The events, venues and
// artists are made up. The layout follows ra.co's event pages.

/** A night in Berlin, with every field, as a desktop browser copies it. */
export const BERLIN_NIGHT = `Events
Germany
Berlin

Night at the Club

Venue
Hall 2
Example Straße 12; 10243 Berlin; Germany
Date
Sat, 18 Jul 2026
23:00 - 07:00
Promoters
Example Promotions
Cost
20€
Interested
1.2K

Lineup
Artist A
Artist B b2b Artist C
Artist D (live)

Genres
Techno
House

A long night of techno across two rooms, with the garden open from the early morning. Admission is at the door's discretion.

https://ra.co/events/1234567`;

/** A night in New York, with 12-hour times, the month before the day, and the lineup on one line. */
export const BROOKLYN_NIGHT = `Events / United States / New York
Warehouse Party
RA Pick
Venue
Example Warehouse
123 Example Ave, Brooklyn, NY 11211, United States
Date
Fri, Nov 20, 2026
10:00 PM - 4:00 AM
Lineup
Artist A, Artist B, Artist C
ra.co/events/7654321`;

/** A weekend festival, from Friday afternoon to Sunday, with no year and no link. */
export const FESTIVAL = `Example Open Air 2027
Venue
Example Field; Example Lane; Bristol; United Kingdom
Date
Fri, 6 Aug - Sun, 8 Aug
14:00 - 23:00
Lineup
Artist A
Artist B`;

/** A party with the venue still to be announced, in a country with several timezones. */
export const UNKNOWN_PLACE = `Secret Party
Venue
TBA
United States
Date
Sat, 12 Dec 2026
22:00
Lineup`;
