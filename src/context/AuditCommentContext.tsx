'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuditLog, Comment } from '@/types/ipo';

const AUDIT_KEY = 'ipo-audit-logs';
const COMMENT_KEY = 'ipo-comments';

function loadFromLS<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToLS<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

interface AuditCommentContextType {
  auditLogs: AuditLog[];
  comments: Comment[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  deleteComment: (id: string) => void;
  getTaskLogs: (taskId: string) => AuditLog[];
  getTaskComments: (taskId: string) => Comment[];
  getRecentLogs: (limit?: number) => AuditLog[];
}

const AuditCommentContext = createContext<AuditCommentContextType | undefined>(undefined);

export function AuditCommentProvider({ children }: { children: ReactNode }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    setAuditLogs(loadFromLS<AuditLog>(AUDIT_KEY));
    setComments(loadFromLS<Comment>(COMMENT_KEY));
  }, []);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'createdAt'>) => {
    const entry: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAuditLogs(prev => {
      // 最多保留500条
      const next = [entry, ...prev].slice(0, 500);
      saveToLS(AUDIT_KEY, next);
      return next;
    });
  }, []);

  const addComment = useCallback((comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const entry: Comment = {
      ...comment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => {
      const next = [entry, ...prev];
      saveToLS(COMMENT_KEY, next);
      return next;
    });
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments(prev => {
      const next = prev.filter(c => c.id !== id);
      saveToLS(COMMENT_KEY, next);
      return next;
    });
  }, []);

  const getTaskLogs = useCallback((taskId: string) => {
    return auditLogs.filter(l => l.taskId === taskId);
  }, [auditLogs]);

  const getTaskComments = useCallback((taskId: string) => {
    return comments.filter(c => c.taskId === taskId);
  }, [comments]);

  const getRecentLogs = useCallback((limit = 20) => {
    return auditLogs.slice(0, limit);
  }, [auditLogs]);

  return (
    <AuditCommentContext.Provider value={{
      auditLogs, comments,
      addAuditLog, addComment, deleteComment,
      getTaskLogs, getTaskComments, getRecentLogs,
    }}>
      {children}
    </AuditCommentContext.Provider>
  );
}

export function useAuditComment(): AuditCommentContextType {
  const ctx = useContext(AuditCommentContext);
  if (!ctx) throw new Error('useAuditComment must be used within AuditCommentProvider');
  return ctx;
}
