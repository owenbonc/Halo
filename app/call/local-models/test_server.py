"""HTTP boundary tests; genuine GPU/codec checks run separately on synthetic audio."""

import http.client
from http.server import HTTPServer
import threading
import unittest
from unittest.mock import Mock

from server import Handler, MAX_BYTES


class BoundaryTests(unittest.TestCase):
    def setUp(self):
        self.inference = Mock(return_value='A synthetic caller.')
        class TestHandler(Handler):
            token = 'synthetic-unit-test-token-not-a-credential'
            transcribe = staticmethod(self.inference)
        self.server = HTTPServer(('127.0.0.1', 0), TestHandler)
        self.worker = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.worker.start()
        self.auth = {'Authorization': 'Bearer ' + TestHandler.token,
                     'Content-Type': 'audio/webm;codecs=opus'}

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.worker.join()

    def request(self, method='POST', path='/transcribe', headers=None, body=b'synthetic'):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=2)
        connection.request(method, path, body, headers=self.auth if headers is None else headers)
        response = connection.getresponse()
        result = response.status, response.read().decode()
        self.assertEqual(response.getheader('Cache-Control'), 'no-store')
        connection.close()
        return result

    def test_rejects_missing_auth_and_browser_origin_before_inference(self):
        self.assertEqual(self.request(headers={})[0], 401)
        self.assertEqual(self.request(headers={**self.auth, 'Origin': 'https://unrelated.test'})[0], 403)
        self.inference.assert_not_called()

    def test_rejects_oversized_or_unknown_audio_without_inference(self):
        self.assertEqual(self.request(headers={**self.auth, 'Content-Length': str(MAX_BYTES+1)})[0], 413)
        self.assertEqual(self.request(headers={**self.auth, 'Content-Type': 'text/plain'})[0], 415)
        self.inference.assert_not_called()

    def test_requires_unambiguous_length(self):
        self.assertEqual(self.request(headers={**self.auth, 'Transfer-Encoding': 'chunked'})[0], 411)
        self.assertEqual(self.request(headers={**self.auth, 'Content-Length': 'invalid'})[0], 400)
        self.inference.assert_not_called()

    def test_transcribes_once_and_preserves_silence(self):
        status, body = self.request()
        self.assertEqual(status, 200)
        self.assertIn('A synthetic caller.', body)
        self.inference.assert_called_once_with(b'synthetic')
        self.inference.return_value = ''
        self.assertEqual(self.request(), (200, '{"transcript": ""}'))

    def test_private_errors_do_not_escape(self):
        self.inference.side_effect = ValueError('synthetic private audio detail')
        status, body = self.request()
        self.assertEqual(status, 422)
        self.assertNotIn('private', body)
        self.inference.side_effect = RuntimeError('synthetic GPU diagnostic')
        status, body = self.request()
        self.assertEqual(status, 503)
        self.assertNotIn('diagnostic', body)

    def test_health_and_unknown_routes(self):
        self.assertEqual(self.request('GET', '/health')[0], 200)
        self.assertEqual(self.request('GET', '/missing')[0], 404)
        self.assertEqual(self.request(path='/missing')[0], 404)
        self.inference.assert_not_called()


if __name__ == '__main__':
    unittest.main()
