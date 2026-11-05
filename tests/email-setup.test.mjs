import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emailTestSettings} from '../scripts/setup-email.mjs';

test('free email setup cannot enable bulk sending or upload unrelated service secrets',()=>{
  const input={RESEND_API_KEY:'re_synthetic_key_for_testing_only',EMAIL_FROM:'WellNest <onboarding@resend.dev>',EMAIL_TEST_RECIPIENT:'owner@example.test',PUBLIC_APP_URL:'https://wellnest-healthcare.vercel.app',DELIVERY_ENABLED:'false',TWILIO_AUTH_TOKEN:'must-not-be-exported',SCAN_API_TOKEN:'must-not-be-exported'};
  const settings=emailTestSettings(input);
  assert.deepEqual(Object.keys(settings).sort(),['DELIVERY_ENABLED','EMAIL_FROM','PUBLIC_APP_URL','RESEND_API_KEY']);
  assert.equal(settings.DELIVERY_ENABLED,'false');
  assert.throws(()=>emailTestSettings({...input,DELIVERY_ENABLED:'true'}));
  assert.throws(()=>emailTestSettings({...input,EMAIL_FROM:'other@example.test'}));
  assert.throws(()=>emailTestSettings({...input,PUBLIC_APP_URL:'https://other.example.test'}));
  assert.throws(()=>emailTestSettings({...input,RESEND_API_KEY:''}));
});
