import { determineWinner } from './MiddleNumber';

describe('Middle Number Game - determineWinner', () => {
    test('returns null when no players', () => {
        const result = determineWinner([], 500);
        expect(result).toBeNull();
    });

    test('returns null when no players have submitted numbers', () => {
        const players = [
            { uname: 'Alice', num: 0 },
            { uname: 'Bob', num: 0 }
        ];
        const result = determineWinner(players, 500);
        expect(result).toBeNull();
    });

    test('returns middle winner with 2 players (adds random third)', () => {
        const players = [
            { uname: 'Alice', num: 100 },
            { uname: 'Bob', num: 900 }
        ];
        const result = determineWinner(players, 500);
        // Winner should be determined - could be Alice, Bob, or Computer depending on random number
        expect(result).toBeTruthy();
        expect(result.uname).toBeDefined();
    });

    test('returns middle winner with 3 players', () => {
        const players = [
            { uname: 'Alice', num: 100 },
            { uname: 'Bob', num: 500 },
            { uname: 'Charlie', num: 900 }
        ];
        const result = determineWinner(players, 500);
        expect(result.uname).toBe('Bob');
    });

    test('returns second smallest with 4 players', () => {
        const players = [
            { uname: 'Alice', num: 100 },
            { uname: 'Bob', num: 300 },
            { uname: 'Charlie', num: 700 },
            { uname: 'Dave', num: 900 }
        ];
        const result = determineWinner(players, 500);
        expect(result.uname).toBe('Bob');
    });

    test('returns second smallest with 5 players', () => {
        const players = [
            { uname: 'Alice', num: 100 },
            { uname: 'Bob', num: 200 },
            { uname: 'Charlie', num: 500 },
            { uname: 'Dave', num: 700 },
            { uname: 'Eve', num: 900 }
        ];
        const result = determineWinner(players, 500);
        expect(result.uname).toBe('Bob');
    });

    test('handles unsorted player numbers correctly', () => {
        const players = [
            { uname: 'Alice', num: 900 },
            { uname: 'Bob', num: 100 },
            { uname: 'Charlie', num: 500 }
        ];
        const result = determineWinner(players, 500);
        expect(result.uname).toBe('Charlie');
    });

    test('filters out players who have not submitted (num = 0)', () => {
        const players = [
            { uname: 'Alice', num: 100 },
            { uname: 'Bob', num: 500 },
            { uname: 'Charlie', num: 0 },
            { uname: 'Dave', num: 900 }
        ];
        const result = determineWinner(players, 500);
        // Should only consider Alice, Bob, Dave (3 players) - middle wins
        expect(result.uname).toBe('Bob');
    });

    test('handles duplicate numbers - first in sorted order wins', () => {
        const players = [
            { uname: 'Alice', num: 100 },
            { uname: 'Bob', num: 100 },
            { uname: 'Charlie', num: 500 }
        ];
        const result = determineWinner(players, 500);
        // After sorting: 100 (Alice or Bob), 100, 500
        // Middle player wins - could be either Alice or Bob
        expect(['Alice', 'Bob']).toContain(result.uname);
    });
});
