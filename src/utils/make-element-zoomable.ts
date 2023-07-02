import { hideElementOverflow } from './hide-element-overflow';
import { ZoomDragHTMLElement } from './zoom-drag-html-element.model';

/**
 * Makes the Element zoomable
 * @param param.element - the element to be zoomable
 * @param param.zoomInBtnId - id of the zoom-in button (defaults to `xyzw-zoom-in-button`)
 * @param param.zoomOutBtnId - id of the zoom-out button (defaults to `xyzw-zoom-out-button`)
 * @param param.steps - steps to zoom-in/zoom-out (defaults to `30`)
 * @param param.CONTAINER_WITH_OVERFLOW_HIDDEN_CSS_CLASS - Custom CSS class name to be used (optional / internally provided)
 * @param param.MIN - Minimum zoom value (defaults to 1 (100%))
 * @param param.MAX - Maximum zoom value (defaults to 5 (500%))
 * @return element with `.stopZoomableBehavior()` method to help stop behavior
 * @example
 * // make element zoomable
 * const zoomableElmnt = makeElementZoomable({ element: document.getElementById('my-element') });
 * // now it's not zoomable anymore
 * zoomableElmnt.stopZoomableBehavior();
 */
export function makeElementZoomable ({element, zoomInBtnId = 'xyzw-zoom-in-button', zoomOutBtnId = 'xyzw-zoom-out-button', steps = 30, CONTAINER_WITH_OVERFLOW_HIDDEN_CSS_CLASS = 'xyzw-container', MIN = 1, MAX = 5}: {element: HTMLElement; zoomInBtnId?: string; zoomOutBtnId?: string; steps?: number; CONTAINER_WITH_OVERFLOW_HIDDEN_CSS_CLASS?: string; MIN?: number; MAX?: number}): ZoomDragHTMLElement | null {
  // gets the element and, at the same time, add the behavior: hide when element
  // overflows parent, while zooming
  element = hideElementOverflow({ element: element, CONTAINER_WITH_OVERFLOW_HIDDEN_CSS_CLASS: CONTAINER_WITH_OVERFLOW_HIDDEN_CSS_CLASS })!;

  // gets the html elements necessary for the functionality
  const zoomInBtn = element.ownerDocument.getElementById(zoomInBtnId);
  const zoomOutBtn = element.ownerDocument.getElementById(zoomOutBtnId);

  // log error, if the element is not found, and exit execution
  if (!zoomInBtn || !zoomOutBtn) {
    console.error(
      `Error: makeElementZoomable function can't find the elements with the following ids:
      ${!zoomInBtn ? `zoomInBtnId: ${zoomInBtnId}` : ''}
      ${!zoomOutBtn ? `zoomOutBtnId: ${zoomOutBtnId}` : ''}`
    );
    return null;
  }

  // value of the css scale ( 1 represents 100% )
  let scaleValue = 1;

  // convert steps to decimal, to allow percentage calculation
  steps /= 100;

  // zoom in
  zoomInBtn.onclick = () => {
    scaleValue = Math.min(scaleValue * (1 + steps), MAX);
    element.style.transform = `scale(${scaleValue})`;
  };

  // zoom out
  zoomOutBtn.onclick = () => {
    scaleValue = Math.max(scaleValue / (1 + steps), MIN);
    element.style.transform = `scale(${scaleValue})`;
  };

  // zoom in/out with mouse wheel
  element.onwheel = (event) => {
    event.preventDefault();

    if (event.deltaY < 0) {
      scaleValue = Math.min(scaleValue * (1 + steps), MAX);
    } else {
      scaleValue = Math.max(scaleValue / (1 + steps), MIN);
    }

    element.style.transform = `scale(${scaleValue})`;
  };

  // returns an element with .stopZoomableBehavior() method to
  // help remove zoomable behavior from element, if needed
  return Object.assign((element as ZoomDragHTMLElement), {
    stopZoomableBehavior() {
      zoomInBtn.onclick = null;
      zoomOutBtn.onclick = null;
      element.onwheel = null;
      (element as ZoomDragHTMLElement).stopHiddenOverflowBehavior?.();
      element.style.transform = 'unset';
      return element;
    },
    currentZoom() {
      return scaleValue;
    },
  });
};
