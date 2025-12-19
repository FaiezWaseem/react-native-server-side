"use client";

import React, { useState, useEffect, useMemo } from 'react';
import * as Babel from '@babel/standalone';
import { RefreshCw } from "lucide-react";

// 1. IMPORT REAL REACT NATIVE WEB COMPONENTS
// Note: We are in a Next.js environment, so we use react-native-web which is aliased to react-native usually
// But here we might need to import directly from react-native-web or rely on webpack aliases if configured.
// For now, let's assume standard 'react-native-web' exports are available or we mock them if missing.

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  //@ts-ignore
  StyleSheet,
  FlatList,
  Alert,
  Keyboard,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  Linking,
  Dimensions
} from 'react-native-web';

const Platform = {
  OS: 'web',
}
// Mock missing components/APIs if necessary
const redirectTo = (url: string) => console.log('Redirect to:', url);

const useCodeParser = (codeString: string) => {
  const [Component, setComponent] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  // 2. DEFINE THE SCOPE
  const scope = useMemo(() => ({
    React,
    useState,
    useEffect,
    useMemo,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    FlatList,
    //@ts-ignore
    Alert,
    //@ts-ignore
    Keyboard,
    Platform,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Image,
    ScrollView,
    ActivityIndicator,
    //@ts-ignore
    Animated,
    //@ts-ignore
    Easing,
    //@ts-ignore
    RefreshControl,
    //@ts-ignore
    Linking,
    //@ts-ignore
    Dimensions,
    redirectTo,
    props: { navigation: { navigate: console.log }, route: { params: {} } }
  }), []);

  useEffect(() => {
    if (!codeString) {
      setComponent(null);
      return;
    }

    try {
      // 3. TRANSPILE JSX TO JS
      // Babel will preserve the 'return' keyword if it's at the top level of the code.
      // But 'return' is only valid inside a function.
      // When we wrap it in an IIFE below, it becomes valid.
      // HOWEVER, Babel's parser might complain about top-level return BEFORE we wrap it
      // if we don't configure it correctly or if it parses as a module.


      const transpiledOutput = Babel.transform(codeString, {
        presets: ['react', 'env'],
        plugins: ['transform-async-to-generator'],
        parserOpts: { allowReturnOutsideFunction: true },
        filename: 'dynamic.js',
      }).code;

      // 4. PREPARE FUNCTION EXECUTION
      const scopeKeys = Object.keys(scope);
      const scopeValues = Object.values(scope);


      const cleanCode = transpiledOutput?.replace(/"use strict";/g, '').replace(/'use strict';/g, '');
 
      // 5. CREATE AND EXECUTE THE FUNCTION
      // @ts-ignore
      const generateElement = new Function(...scopeKeys, cleanCode);

      // Execute to get the React Element
      const resultElement = generateElement(...scopeValues);

      setComponent(resultElement);
      setError(null);
    } catch (err: any) {
      console.error("Parse Error:", err);
      setError(err.message);
    }
  }, [codeString, scope]);

  return { Component, error };
};

interface MobilePreviewProps {
  title: string;
  content: string;
}

export const MobilePreview = ({ title, content }: MobilePreviewProps) => {
  const [key, setKey] = useState(0);
  const { Component, error } = useCodeParser(content);

  return (
    <div className="mx-auto w-[320px] h-[640px] border-[12px] border-gray-900 rounded-[3rem] overflow-hidden bg-white shadow-xl relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10"></div>

      {/* Screen Content */}
      <div className="h-full w-full bg-gray-50 relative overflow-hidden flex flex-col">
        {!content ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <p>Start typing or use AI to generate a preview</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500 p-4 text-center overflow-auto">
            <p className="font-bold mb-2">Error</p>
            <p className="text-xs text-left break-words font-mono bg-red-50 p-2 rounded w-full">{error}</p>
          </div>
        ) : (
          <div className="flex-1 w-full h-full relative" key={key}>
            {/* 
                  We need a container that mimics the React Native root view.
                  react-native-web components usually render as divs/spans with specific classes.
                  Since we are running this in the main DOM, styles should apply naturally if react-native-web is working.
                */}
            {Component}
          </div>
        )}
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full opacity-20 z-20"></div>

      {/* Refresh Button Overlay */}
      <button
        onClick={() => setKey(prev => prev + 1)}
        className="absolute bottom-4 right-4 z-30 bg-gray-900/10 hover:bg-gray-900/20 p-2 rounded-full transition-colors"
        title="Refresh Preview"
      >
        <RefreshCw className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};
