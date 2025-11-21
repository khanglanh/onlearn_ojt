import { api } from './client';

export async function fetchHello(name = 'world') {
  const res = await api.get('/hello', { params: { name } });
  return res.data; // { message: "Hello, ..." }
}

export async function echoMessage(message) {
  const res = await api.post('/echo', { message });
  return res.data; // { message: "You said: ..." }
}
