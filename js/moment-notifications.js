/**
 * moment-notifications.js — 朋友圈互动通知（点赞/评论/回复）
 */
window.MI = window.MI || {};

MI.MomentNotifications = {
  getAll: function () {
    return MI.Storage.get('mi_moment_notifications', []);
  },

  setAll: function (list) {
    MI.Storage.set('mi_moment_notifications', list);
    this._notifyChange();
  },

  getUnread: function () {
    var list = this.getAll();
    var unread = [];
    for (var i = 0; i < list.length; i++) {
      if (!list[i].read) unread.push(list[i]);
    }
    unread.sort(function (a, b) { return b.timestamp - a.timestamp; });
    return unread;
  },

  getUnreadCount: function () {
    return this.getUnread().length;
  },

  add: function (notification) {
    if (!notification || !notification.momentId) return;
    var list = this.getAll();
    list.unshift({
      id: notification.id || MI.Data.genId('mn'),
      type: notification.type || 'comment',
      momentId: notification.momentId,
      commentId: notification.commentId || null,
      actorId: notification.actorId || '',
      content: notification.content || '',
      timestamp: notification.timestamp || Date.now(),
      read: false
    });
    if (list.length > 100) list = list.slice(0, 100);
    this.setAll(list);
  },

  markAllRead: function () {
    var list = this.getAll();
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      if (!list[i].read) {
        list[i].read = true;
        changed = true;
      }
    }
    if (changed) this.setAll(list);
  },

  markReadByMoment: function (momentId) {
    var list = this.getAll();
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].momentId === momentId && !list[i].read) {
        list[i].read = true;
        changed = true;
      }
    }
    if (changed) this.setAll(list);
  },

  notifyLike: function (momentId, actorId) {
    this.add({
      type: 'like',
      momentId: momentId,
      actorId: actorId
    });
  },

  notifyComment: function (momentId, actorId, content, commentId) {
    this.add({
      type: 'comment',
      momentId: momentId,
      actorId: actorId,
      content: content,
      commentId: commentId
    });
  },

  notifyReply: function (momentId, actorId, content, commentId) {
    this.add({
      type: 'reply',
      momentId: momentId,
      actorId: actorId,
      content: content,
      commentId: commentId
    });
  },

  formatText: function (n) {
    var actor = MI.Data.getAuthorById(n.actorId);
    var name = actor ? actor.name : '有人';
    if (n.type === 'like') {
      return name + ' 赞了你的朋友圈';
    }
    if (n.type === 'reply') {
      return name + ' 回复你：' + (n.content || '');
    }
    return name + ' 评论：' + (n.content || '');
  },

  _notifyChange: function () {
    if (MI.WeChat && MI.WeChat.refreshIfVisible) {
      MI.WeChat.refreshIfVisible();
    }
    if (MI.Moments && MI.Moments.refreshIfVisible) {
      MI.Moments.refreshIfVisible();
    }
  }
};
