/**
 * File: app/(tabs)/(root)/_layout.tsx
 * Purpose: Native swipe pager for the five RomBuzz root tabs.
 * Keeps the real neighboring screens mounted so they appear during the drag.
 */

import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationEventMap,
    MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";

import {
    ParamListBase,
    TabNavigationState,
} from "@react-navigation/native";

import {
    withLayoutContext,
} from "expo-router";

const MaterialTopTabs =
  createMaterialTopTabNavigator();

const RootPager = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof MaterialTopTabs.Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(
  MaterialTopTabs.Navigator,
  undefined,
  true
);

export default function RootPagerLayout() {
  return (
    <RootPager
      initialRouteName="homepage"
      tabBar={() => null}
      screenOptions={{
        swipeEnabled: true,

        // Keep the real adjacent screens ready.
        lazy: false,

        // Bottom-button page changes stay animated.
        animationEnabled: true,
      }}
    >
      <RootPager.Screen
        name="homepage"
      />

      <RootPager.Screen
        name="letsbuzz"
      />

      <RootPager.Screen
        name="social-stats"
      />

      <RootPager.Screen
        name="chat"
      />

      <RootPager.Screen
        name="profile"
      />
    </RootPager>
  );
}