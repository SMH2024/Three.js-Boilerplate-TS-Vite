#include chunk2.frag;
#include ../chunk3.frag;

vec3 chunkRGB () {
  return vec3(chunkRed(), chunkGreen(), 0.0);
}
