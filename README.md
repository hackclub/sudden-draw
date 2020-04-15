# HERRE THERE BE DRAGONS.

this is a working doc to figure out exactly what i'm trying to do

### memory

everything is stored in localstorage through the `getMemory` && `setMemory` functions. this needs to change. all the pulling and pushing (a couple places are n^2 or worse) from localstorage is slowing down the redraws. There are a couple things I want to do about this.

- [ ] clicks on the current layer should save to storage on mouseup, but not on mousedown
  - redraw should be updated to draw from memory + the unstored clicks of a current mouse movement
  - handle race condition where someone tries to undo while drawing (????)
    - other option is to just lose data & throw an alert that says '🏎🏁'
    - how am i this tired already?
- [ ] mousemoves shouldn't redraw the whole canvas. if the following is true, it's quicker to just draw in the moment:
  - shift isn't pressed, and wasn't pressed during the last mouse movement
  - i'm picking up a mousedown, mousemove, or mouseup event