// Runs before every web test file. The recorded voice lines start as an empty index, as if already fetched: a
// screen with a "Nghe" button then makes no request of its own, so tests that list the calls a screen makes see
// only theirs. speech.test.ts sets its own index.
import { setRecordedVoicesForTest } from './ui/dialogue/recorded-voice';

setRecordedVoicesForTest({});
