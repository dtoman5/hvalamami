'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error(err, info); }
  render() {
    if (this.state.hasError) {
      return <div className="text-center p-4">Napaka pri nalaganju.</div>;
    }
    return this.props.children;
  }
}