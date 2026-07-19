import { parseTags, cleanDescription, dedupeSeries, groupMeetings } from './calendar';

describe('parseTags', () => {
    it('finds ##featured and ##meeting-gov', () => {
        expect(parseTags('Come join us! ##featured ##meeting-gov')).toEqual([
            'featured',
            'meeting-gov',
        ]);
    });

    it('is case-insensitive', () => {
        expect(parseTags('##Featured ##MEETING-NSVYD')).toEqual(['featured', 'meeting-nsvyd']);
    });

    it('ignores single-hash tokens like #1 or #single', () => {
        expect(parseTags('#1 priority #single tag')).toEqual([]);
    });

    it('does not match ###triple or ####quad as a tag', () => {
        expect(parseTags('###triple heading ####quad')).toEqual([]);
    });

    it('finds multiple tags in one description', () => {
        expect(parseTags('##meeting-nsvyd ##featured ##meeting-partner')).toEqual([
            'meeting-nsvyd',
            'featured',
            'meeting-partner',
        ]);
    });

    it('handles HTML-wrapped tags', () => {
        expect(parseTags('<p>event ##featured</p>')).toEqual(['featured']);
    });

    it('returns empty array for null/undefined', () => {
        expect(parseTags(null)).toEqual([]);
        expect(parseTags(undefined)).toEqual([]);
    });
});

describe('cleanDescription', () => {
    it('strips HTML tags', () => {
        expect(cleanDescription('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('strips ## tags anywhere in text', () => {
        expect(cleanDescription('Come to the event ##featured this week')).toBe(
            'Come to the event this week'
        );
    });

    it('preserves "#1 priority"', () => {
        expect(cleanDescription('#1 priority item')).toBe('#1 priority item');
    });

    it('preserves runs of 3+ hashes as plain text', () => {
        expect(cleanDescription('###triple heading stays')).toBe('###triple heading stays');
    });

    it('collapses whitespace left behind by a stripped tag line', () => {
        expect(cleanDescription('Hello\n\n\n\n##featured\n\n\n\nGoodbye')).toBe(
            'Hello\n\nGoodbye'
        );
    });

    it('returns empty string for falsy input', () => {
        expect(cleanDescription('')).toBe('');
        expect(cleanDescription(null)).toBe('');
    });
});

describe('dedupeSeries', () => {
    it('keeps first event when same recurringEventId', () => {
        const events = [
            { id: '1', title: 'Meeting', recurringEventId: 'abc', tags: [] },
            { id: '2', title: 'Meeting', recurringEventId: 'abc', tags: [] },
        ];
        const result = dedupeSeries(events);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('dedupes same title with different case/spacing', () => {
        const events = [
            { id: '1', title: '  Monthly Meeting ', recurringEventId: null, tags: [] },
            { id: '2', title: 'monthly meeting', recurringEventId: null, tags: [] },
        ];
        const result = dedupeSeries(events);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('keeps distinct titles', () => {
        const events = [
            { id: '1', title: 'Planning Meeting', recurringEventId: null, tags: [] },
            { id: '2', title: 'Social Hour', recurringEventId: null, tags: [] },
        ];
        const result = dedupeSeries(events);
        expect(result).toHaveLength(2);
    });
});

describe('groupMeetings', () => {
    const makeEvent = (id, title, tags) => ({
        id,
        title,
        tags,
        recurringEventId: null,
    });

    it('orders buckets: nsvyd, partner, gov, unknown-alpha, other', () => {
        const events = [
            makeEvent('1', 'NSVYD Monthly', ['meeting-nsvyd']),
            makeEvent('2', 'Govt Forum', ['meeting-gov']),
            makeEvent('3', 'Partner Chat', ['meeting-partner']),
            makeEvent('4', 'Book Club', ['meeting-book-club']),
            makeEvent('5', 'Random Mtg', ['meeting']),
        ];
        const groups = groupMeetings(events);
        expect(groups.map((g) => g.slug)).toEqual([
            'nsvyd',
            'partner',
            'gov',
            'book-club',
            'other',
        ]);
    });

    it('bare ##meeting lands in Other', () => {
        const events = [makeEvent('1', 'Some Mtg', ['meeting'])];
        const groups = groupMeetings(events);
        expect(groups).toHaveLength(1);
        expect(groups[0].slug).toBe('other');
        expect(groups[0].label).toBe('Other Meetings');
    });

    it('unknown slug ##meeting-book-club renders as "Book Club"', () => {
        const events = [makeEvent('1', 'Book Club', ['meeting-book-club'])];
        const groups = groupMeetings(events);
        expect(groups[0].label).toBe('Book Club');
    });

    it('excludes non-meeting events', () => {
        const events = [
            makeEvent('1', 'Social', ['featured']),
            makeEvent('2', 'Meeting', ['meeting-nsvyd']),
        ];
        const groups = groupMeetings(events);
        expect(groups).toHaveLength(1);
        expect(groups[0].events[0].id).toBe('2');
    });

    it('drops empty buckets', () => {
        const events = [makeEvent('1', 'Only NSVYD', ['meeting-nsvyd'])];
        const groups = groupMeetings(events);
        expect(groups).toHaveLength(1);
        expect(groups[0].slug).toBe('nsvyd');
    });
});
