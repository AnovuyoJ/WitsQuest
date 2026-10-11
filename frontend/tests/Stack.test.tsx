import { act, fireEvent, render, screen } from '@testing-library/react';
import Stack from '../components/Stack';

const cards = [<button key="a">Alpha</button>, <button key="b">Beta</button>, <button key="c">Gamma</button>];
const top = () => document.querySelector('.stack-card[data-top]');
function pointer(target: Element | Window, type: string, x: number, y: number) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'mouse' } });
  fireEvent(target, event);
}
beforeEach(() => {
  jest.useFakeTimers();
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

test.each(['fan', 'cascade', 'deck', 'pile'])('next control cycles %s cards and reports the new top card', (layout) => {
  const onChange = jest.fn();
  render(<Stack onChange={onChange} cards={cards} layout={layout} showControls />);
  expect(top()).toHaveTextContent('Alpha');
  fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
  expect(top()).toHaveTextContent('Beta');
  expect(onChange).toHaveBeenCalledWith(1);
  act(() => { jest.advanceTimersByTime(1600); });
  fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
  expect(top()).toHaveTextContent('Gamma');
});

test('keyboard navigation cycles cards but ignores keys from child controls', () => {
  render(<Stack onChange={jest.fn()} cards={cards} />);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Alpha' }), { key: 'Enter' });
  expect(top()).toHaveTextContent('Alpha');
  fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowRight' });
  expect(top()).toHaveTextContent('Beta');
});

test('autoplay pauses while hovering and resumes after leaving', () => {
  render(<Stack onChange={jest.fn()} cards={cards} autoplay autoplayDelay={500} pauseOnHover />);
  fireEvent.mouseEnter(screen.getByRole('group'));
  act(() => { jest.advanceTimersByTime(600); });
  expect(top()).toHaveTextContent('Alpha');
  fireEvent.mouseLeave(screen.getByRole('group'));
  act(() => { jest.advanceTimersByTime(500); });
  expect(top()).toHaveTextContent('Beta');
});

test('a single card cannot advance and changing the collection preserves a valid top card', () => {
  const { rerender } = render(<Stack onChange={jest.fn()} cards={[cards[0]]} showControls />);
  expect(screen.getByRole('button', { name: 'Next card' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('group'), { key: 'Enter' });
  expect(top()).toHaveTextContent('Alpha');
  rerender(<Stack onChange={jest.fn()} cards={cards} showControls />);
  fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
  expect(top()).toHaveTextContent('Beta');
  rerender(<Stack onChange={jest.fn()} cards={[cards[0]]} showControls />);
  expect(top()).toHaveTextContent('Alpha');
});

test('clicking the top card advances when enabled', () => {
  render(<Stack onChange={jest.fn()} cards={cards} sendToBackOnClick />);
  pointer(top()!, 'pointerdown', 0, 0);
  pointer(window, 'pointerup', 0, 0);
  expect(top()).toHaveTextContent('Beta');
});

test('dragging beyond the threshold advances the card and suppresses its accidental click', () => {
  const click = jest.fn();
  render(<Stack onChange={jest.fn()} cards={[<button key="a" onClick={click}>Alpha</button>, cards[1]]} />);
  const first = top()!;
  pointer(first, 'pointerdown', 0, 0);
  pointer(window, 'pointermove', 3, 0);
  pointer(window, 'pointermove', 120, 30);
  act(() => { jest.advanceTimersByTime(80); });
  pointer(window, 'pointerup', 120, 30);
  expect(top()).toHaveTextContent('Beta');
  fireEvent.click(first.querySelector('button')!);
  expect(click).not.toHaveBeenCalled();
});

test('cancelled dragging returns the card instead of advancing it', () => {
  render(<Stack onChange={jest.fn()} cards={cards} />);
  pointer(top()!, 'pointerdown', 0, 0);
  pointer(window, 'pointermove', 120, 0);
  pointer(window, 'pointercancel', 120, 0);
  expect(top()).toHaveTextContent('Alpha');
});
