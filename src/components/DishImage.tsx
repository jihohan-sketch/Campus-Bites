import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { radius, useStyles, useTheme, type Theme } from '../theme';
import { foodEmoji } from '../utils/foodIcon';
import { dishImageUrl } from '../utils/foodImage';
import { USE_NATIVE_DRIVER } from './motion';

interface DishImageProps {
  /** The raw menu line, e.g. `친환경백미밥`. */
  name: string;
  /** Rendered edge length in points, for the square case. */
  size?: number;
  /** Overrides `size` when the tile is not a square — the hero photo. */
  width?: DimensionValue;
  height?: number;
  /** The meal's tinted fill, used for the placeholder behind the photo. */
  tint?: string;
  /** Corner rounding; defaults to a size-appropriate squircle. */
  round?: number;
  /** Suppresses the emoji stand-in — right for a photo that fills a panel. */
  hideEmoji?: boolean;
}

/**
 * How much bigger the fetched image is than the tile it fills. Menu thumbnails
 * are small and screens are dense, so 2x keeps them crisp without asking the
 * generator for a picture nobody zooms into.
 */
const PIXEL_SCALE = 2;
/** Sizes actually requested, so a whole screen shares a couple of URLs' worth of work. */
const REQUEST_STEPS = [128, 256, 512];
/**
 * A dish nobody has opened before has to be drawn before it can be sent, and
 * the generator turns requests away while it is busy drawing for someone else.
 * A 429 means "ask again in a moment", not "there is no picture", so a failed
 * tile retries a few times before settling for the placeholder. An already
 * drawn picture comes back from cache and is never throttled, so this only
 * runs on genuinely new menu lines — normally none.
 */
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 2500;
/**
 * The step a hero shows while its own, larger size is still being drawn. Every
 * menu line in the bundled 식단표 is warmed at this size by
 * `scripts/warm-dish-images.mjs`, so it is the largest picture that is
 * reliably already in the cache — keep the two in step.
 */
const PREVIEW_STEP = 256;

function requestSize(size: number): number {
  const wanted = size * PIXEL_SCALE;
  return REQUEST_STEPS.find((step) => step >= wanted) ?? REQUEST_STEPS[REQUEST_STEPS.length - 1];
}

/**
 * The photo of one dish.
 *
 * Generated pictures are not instant the first time a menu line is ever seen,
 * and the network is not guaranteed, so this never shows a hole: a tinted
 * placeholder — carrying the emoji that used to sit here — holds the tile from
 * the first frame, the photo fades in over it when it arrives, and a failure
 * simply leaves the placeholder in place. Nothing reflows in any of those
 * cases: the tile is the same box throughout.
 *
 * The generator only ever draws squares, so a non-square box (the hero) crops
 * a square photo rather than asking for a second, colder URL — the top-down
 * plating this app prompts for is all centre and white margin, which is
 * exactly what survives a crop.
 */
export function DishImage({
  name,
  size = 40,
  width,
  height,
  tint,
  round,
  hideEmoji = false,
}: DishImageProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const [loaded, setLoaded] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const previewFade = useRef(new Animated.Value(0)).current;
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A new dish in the same tile (paging to another day) starts over.
  useEffect(() => {
    setLoaded(false);
    setPreviewed(false);
    setAttempt(0);
    setFailed(false);
    fade.setValue(0);
    previewFade.setValue(0);
  }, [name, fade, previewFade]);

  // A tile that scrolls away mid-backoff must not come back and set state on
  // an unmounted component.
  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  const onError = () => {
    if (attempt + 1 >= MAX_ATTEMPTS) {
      setFailed(true);
      return;
    }
    // Spread the retries out. A screen full of tiles that were all turned away
    // together must not all come back at the same instant and be turned away
    // again.
    const delay = RETRY_BASE_MS * 2 ** attempt + Math.random() * 1000;
    retryTimer.current = setTimeout(() => setAttempt((current) => current + 1), delay);
  };

  useEffect(() => {
    if (!loaded) return;
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [loaded, fade]);

  useEffect(() => {
    if (!previewed) return;
    Animated.timing(previewFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [previewed, previewFade]);

  const boxHeight = height ?? size;
  const corner = round ?? (boxHeight >= 64 ? radius.md : radius.xs);
  const box = { width: width ?? size, height: boxHeight, borderRadius: corner };
  // A wide box is cropped from a square, so the picture has to be requested at
  // the long edge or it arrives soft.
  const longEdge = Math.max(boxHeight, typeof width === 'number' ? width : size);
  const full = requestSize(longEdge);
  /**
   * A hero asks for a size no thumbnail uses, and the generator draws — and
   * rate-limits — a size it has never been asked for. So the hero shows the
   * step every dish already has underneath, and the sharper one fades in over
   * it: the picture is on screen immediately and simply gets crisper, instead
   * of the card sitting on a flat colour while a 512 waits behind a 429.
   */
  const preview = full > PREVIEW_STEP ? dishImageUrl(name, PREVIEW_STEP) : null;

  return (
    <View
      style={[styles.tile, box, { backgroundColor: tint ?? t.colors.surfaceSunken }]}
      accessible={false}
      // The dish name is already read out next to this tile; announcing the
      // picture as well would just say everything twice.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {hideEmoji || previewed ? null : (
        <Text style={[styles.emoji, { fontSize: Math.round(Math.min(boxHeight, 96) * 0.44) }]}>
          {foodEmoji(name)}
        </Text>
      )}

      {preview ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: previewFade }]}>
          <Image
            source={{ uri: preview }}
            style={[StyleSheet.absoluteFill, { borderRadius: corner }]}
            resizeMode="cover"
            onLoad={() => setPreviewed(true)}
            {...(Platform.OS === 'web' ? { decoding: 'async' } : null)}
          />
        </Animated.View>
      ) : null}

      {failed ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Image
            // Remounting is what actually re-issues the request; the URL is
            // unchanged, so a picture that exists by then comes from cache.
            key={attempt}
            source={{ uri: dishImageUrl(name, full) }}
            style={[StyleSheet.absoluteFill, { borderRadius: corner }]}
            resizeMode="cover"
            onLoad={() => setLoaded(true)}
            onError={onError}
            // Web decodes off the main thread, which matters on a screen that
            // mounts a dozen of these at once.
            {...(Platform.OS === 'web' ? { decoding: 'async', loading: 'lazy' } : null)}
          />
        </Animated.View>
      )}

      {/* A hairline of light along the top edge. Generated food photography is
          almost always bright in the middle and flat at the rim, and this is
          what keeps the tile from reading as a pasted-on rectangle. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: corner }]}
        pointerEvents="none"
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    tile: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    emoji: { opacity: 0.75 },
  });
