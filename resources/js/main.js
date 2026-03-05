// JavaScript session tracking with reset functionality
class SessionTracker {
  constructor(url) {
    this.url = url;
    this.sessionKey = `session_${btoa(url).replace(/[^a-zA-Z0-9]/g, "")}`;
    this.tabId = this.generateTabId();
    this.init();
  }

  generateTabId() {
    return Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  init() {
    const now = Date.now();

    // Reset session time for new tab/window or when browser is reopened
    this.resetSessionIfNeeded();

    // Set session start time for this tab
    sessionStorage.setItem(this.sessionKey, now.toString());
    sessionStorage.setItem(`${this.sessionKey}_tab`, this.tabId);
    this.sessionStart = now;

    // Track page navigation within same tab
    this.trackPageNavigation();

    // Start tracking
    this.startTracking();
  }

  resetSessionIfNeeded() {
    // Check if this is a new browser session
    const lastTabId = sessionStorage.getItem(`${this.sessionKey}_tab`);

    if (!lastTabId) {
      // New browser session - clear all session data
      this.clearAllSessionData();
    }
  }

  clearAllSessionData() {
    // Clear localStorage data related to this URL
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(this.sessionKey)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear sessionStorage data
    sessionStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(`${this.sessionKey}_tab`);
  }

  trackPageNavigation() {
    // Reset session time when navigating to different page
    let isFirstLoad = true;

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !isFirstLoad) {
        // User came back to this tab - restart session timer
        this.restartSession();
      }
    });

    // Track beforeunload (page leave)
    window.addEventListener("beforeunload", () => {
      this.saveSessionData();
    });

    // Track page load
    window.addEventListener("load", () => {
      isFirstLoad = false;
    });

    // Track hash changes (SPA navigation)
    window.addEventListener("hashchange", () => {
      this.restartSession();
    });

    // Track popstate (browser back/forward)
    window.addEventListener("popstate", () => {
      this.restartSession();
    });
  }

  restartSession() {
    const now = Date.now();
    sessionStorage.setItem(this.sessionKey, now.toString());
    this.sessionStart = now;
    console.log("Session restarted due to page navigation");
  }

  getSessionDuration() {
    const startTime = parseInt(
      sessionStorage.getItem(this.sessionKey) || this.sessionStart
    );
    return Math.floor((Date.now() - startTime) / 1000);
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  incrementPageViews() {
    const viewsKey = `views_${this.sessionKey}`;
    const views = parseInt(sessionStorage.getItem(viewsKey) || "0") + 1;
    sessionStorage.setItem(viewsKey, views.toString());
  }

  getSessionData() {
    const duration = this.getSessionDuration();
    const views = parseInt(
      sessionStorage.getItem(`views_${this.sessionKey}`) || "1"
    );
    const startTime = parseInt(
      sessionStorage.getItem(this.sessionKey) || this.sessionStart
    );

    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = now.getTimezoneOffset();

    const startDate = new Date(startTime);
    const currentDate = new Date();

    const timezoneOffsetString = this.formatTimezoneOffset(timezoneOffset);

    // Format theo chuẩn d/m/Y H:i:s
    const formatDateTime = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    return {
      session_start: `${formatDateTime(startDate)} (${timezoneOffsetString})`,
      current_time: `${formatDateTime(currentDate)} (${timezoneOffsetString})`,

      timezone: userTimezone,
      timezone_offset_minutes: timezoneOffset,
      timezone_offset_hours: Math.floor(Math.abs(timezoneOffset) / 60),
      timezone_offset_string: timezoneOffsetString,

      // Timestamps
      session_start_timestamp: startTime,
      current_timestamp: Date.now(),

      // Session data
      duration_seconds: duration,
      duration_formatted: this.formatDuration(duration),
      page_views: views,
      tab_id: this.tabId,
    };
  }

  formatTimezoneOffset(offsetMinutes) {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes <= 0 ? "+" : "-"; // Note: getTimezoneOffset returns negative for positive offsets

    return `GMT${sign}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
  startTracking() {
    // Update every 1 seconds
    this.trackingInterval = setInterval(() => {
      this.updateSessionData();
    }, 1000);

    // Increment page views on init
    this.incrementPageViews();
  }

  updateSessionData() {
    const sessionData = this.getSessionData();
    // Optional: Send periodic updates to server
    //console.log('Session data:', sessionData);
  }

  saveSessionData() {
    const sessionData = this.getSessionData();
    // Save final session data
    sessionStorage.setItem(
      `final_${this.sessionKey}`,
      JSON.stringify(sessionData)
    );

    // Clear the tracking interval
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
  }

  // Method to manually reset session (if needed)
  resetSession() {
    this.clearAllSessionData();
    this.init();
  }
}

// Initialize session tracker
const currentUrl = window.location.href;
const sessionTracker = new SessionTracker(currentUrl);

// Function to get session data for form submission
function getSessionDataForSubmission() {
  return sessionTracker.getSessionData();
}

// Optional: Add button to manually reset session
function resetSessionTime() {
  sessionTracker.resetSession();
  console.log("Session time has been reset");
}
window.addEventListener("DOMContentLoaded", function () {
  //slider_js();
  //search_mobile();
  // scrollTo()
  menu_header();
  lazyLoad();
  hide_show_content();
  add_module();
  //game_change_log();
  fullscreen();
  close_game_bottom();
  menu();
  click_event();
  in_iframe();
  unityInputFix();
});
function unityInputFix() {
  const canvas = document.getElementById("unity-canvas");
  if (!canvas) return;

  try {
    canvas.tabIndex = 0;
  } catch (e) {}

  let enableTimer = null;

  const disableCanvas = () => {
    canvas.style.pointerEvents = "none";
    try {
      canvas.blur();
    } catch (e) {}
    // ensure focused input actually receives focus
    setTimeout(() => {
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        try {
          el.focus();
        } catch (e) {}
      }
    }, 0);
  };

  const enableCanvas = () => {
    // only restore pointer events; do NOT force-focus canvas (will steal focus between inputs)
    canvas.style.pointerEvents = "";
  };

  const scheduleEnable = (delay = 200) => {
    if (enableTimer) clearTimeout(enableTimer);
    enableTimer = setTimeout(() => {
      const af = document.activeElement;
      if (
        !af ||
        !(
          af.tagName === "INPUT" ||
          af.tagName === "TEXTAREA" ||
          af.isContentEditable
        )
      ) {
        enableCanvas();
      }
      enableTimer = null;
    }, delay);
  };

  // when focus moves into inputs -> disable canvas and cancel any pending re-enable
  document.addEventListener("focusin", (ev) => {
    if (enableTimer) {
      clearTimeout(enableTimer);
      enableTimer = null;
    }
    const t = ev.target;
    if (!t) return;
    if (
      t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.isContentEditable
    ) {
      disableCanvas();
    }
  });

  // when inputs lose focus -> schedule re-enable (debounced)
  document.addEventListener("focusout", (ev) => {
    const t = ev.target;
    if (!t) return;
    if (
      t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.isContentEditable
    ) {
      // small debounce so switching between inputs won't re-enable canvas
      scheduleEnable(200);
    }
  });

  // clicks on inputs (some browsers don't focus on click event immediately)
  document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!t) return;
    if (
      t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.isContentEditable
    ) {
      if (enableTimer) {
        clearTimeout(enableTimer);
        enableTimer = null;
      }
      disableCanvas();
    }
  });

  // Block Unity's global keyboard listeners while an input is focused.
  const blockUnityKeys = (e) => {
    const el = document.activeElement;
    if (
      el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable)
    ) {
      e.stopImmediatePropagation();
    }
  };
  ["keydown", "keypress", "keyup"].forEach((evt) => {
    window.addEventListener(evt, blockUnityKeys, true); // use capture
  });

  // Observe popups/modals and disable canvas while they are visible (example: contact-popup, .app-popup)
  const checkPopups = () => {
    const contact = document.getElementById("contact-popup");
    const appPopup = document.querySelector(".app-popup");
    const contactVisible = contact && contact.offsetParent !== null;
    const appPopupVisible = appPopup && !appPopup.classList.contains("hidden");
    if (contactVisible || appPopupVisible) {
      if (enableTimer) {
        clearTimeout(enableTimer);
        enableTimer = null;
      }
      disableCanvas();
    } else {
      scheduleEnable(200);
    }
  };

  const mo = new MutationObserver(checkPopups);
  mo.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });
  // run once on init
  checkPopups();
}
function in_iframe() {
  if (self !== top) {
    $(".footer_menu").addClass("hidden");
    $("#game-recommended").addClass("hidden");
    close_side_ads();
    close_game_bottom();
  }
}
function close_side_ads() {
  $(".side_container").addClass("side_container_hidden");
  $(".play-game-header").removeClass("has_ads_side");
  $(".play-game-header__open_side").removeClass("hidden");
  $(".play-game-header__close_side").addClass("hidden");
  $(".game_area").removeClass("has_ads_side");
  $(".similar-games").removeClass("has_ads_side");
  $(".app_container").addClass("no_ads");
}

function open_side_ads() {
  $(".side_container").removeClass("side_container_hidden");
  $(".play-game-header").addClass("has_ads_side");
  $(".game_area").addClass("has_ads_side");
  $(".play-game-header__open_side").addClass("hidden");
  $(".play-game-header__close_side").removeClass("hidden");
  $(".similar-games").addClass("has_ads_side");
  $(".app_container").removeClass("no_ads");
}

function click_event() {
  $(".play-game-header__close_side").click(function () {
    close_side_ads();
  });
  $(".play-game-header__open_side").click(function () {
    open_side_ads();
  });
}

function scrollTo() {
  $(".scrollTo").on("click", function (e) {
    e.preventDefault();
    var target = $(this).attr("data-target");
    var scroll_target = $(this).attr("data-scroll");
    var offset_target = $(this).attr("data-offsettop");
    let id_target = $("#" + target);
    let id_scroll = $("#" + scroll_target);
    id_scroll.animate(
      {
        scrollTop: id_target.offset().top - offset_target,
      },
      500,
      "swing"
    );
  });
}

function fullscreen() {
  $(".play-game-header__fullscreen").click(function () {
    $("body").toggleClass("is_full");
    if ($("body").hasClass("is_full")) {
      toggleFullScreen(document.body);
    } else {
      toggleFullScreen(document.body);
    }
    $("body").bind(
      "webkitfullscreenchange mozfullscreenchange fullscreenchange",
      function (e) {
        var state =
          document.fullScreen ||
          document.mozFullScreen ||
          document.webkitIsFullScreen;
        var event = state ? "FullscreenOn" : "FullscreenOff";

        // Now do something interesting
        // alert('Event: ' + event);

        if (event == "FullscreenOn") {
          open_fullscreen();
        } else if (event == "FullscreenOff") {
          close_fullscreen();
        }
      }
    );
  });
}

function close_game_bottom() {
  $(".close_button_all_games").click(() => {
    $(".similar-games").addClass("hidden");
    $(".game_area").css("height", "100%");
  });
}

// display: flex;
// position: absolute;
// inset: 37px auto auto 1378px;
// margin: 0px;
function menu() {
  $(".play-game-header__menu").click(function (e) {
    let button = $(this);
    let body = $("body");
    let rect = this.getBoundingClientRect();
    let menu_popup = $(".play-game-header-menu");
    body.toggleClass("open_popup");

    // ensure popup measurable even if hidden
    menu_popup.css({
      display: "flex",
      position: "absolute",
      visibility: "hidden",
      left: "-9999px",
      top: "-9999px",
    });
    let popup_width = menu_popup.outerWidth();
    let button_height = button.outerHeight();
    let top_pos_px = rect.top + button_height + 16;

    // compute popup left (numeric) for different layouts
    let popupLeft;
    if ($(window).width() >= 1240 && !$(".app_container").hasClass("no_ads")) {
      popupLeft = rect.left - popup_width / 2 + 28;
    } else {
      popupLeft = $(window).width() - popup_width - 10;
    }

    // If opening, show popup at computed position and position arrow centered to button
    if (body.hasClass("open_popup")) {
      // make visible at final position
      menu_popup.css({
        display: "flex",
        position: "absolute",
        visibility: "",
        left: popupLeft + "px",
        top: top_pos_px + "px",
        margin: "0px",
      });

      // Ensure single hide-fixer
      if ($(".app_container").find(".popup-hide-fixer").length !== 0) {
        $(".app_container").find(".popup-hide-fixer").remove();
      }
      $(".app_container").append("<div class='popup-hide-fixer'></div>");
      $(".popup-hide-fixer").click(function () {
        close_popup_menu();
      });

      // Position arrow: center on button, but clamp inside popup width with padding
      let $arrow = $(".play-game-header__popup-arrow");
      let arrowW = $arrow.outerWidth() || 16; // fallback
      let buttonCenterX = rect.left + button.outerWidth() / 2;
      let arrowLeftRelative = buttonCenterX - popupLeft - arrowW / 2;
      let minLeft = 8; // padding from left
      let maxLeft = popup_width - arrowW - 8; // padding from right
      arrowLeftRelative = Math.max(
        minLeft,
        Math.min(arrowLeftRelative, maxLeft)
      );
      $arrow.css({
        top: "-9px",
        left: arrowLeftRelative + "px",
        right: "unset",
        transform: "rotate(45deg)",
      });
    } else {
      close_popup_menu();
    }
  });
  $(".play-game-header-menu__instruction-button").click(function () {
    let body = $("body");
    body.addClass("open_popup_content");
    close_popup_menu();
    open_popup_content(true, false);
  });
  $(".play-game-header-menu__description-button").click(function () {
    let body = $("body");
    body.addClass("open_popup_content");
    close_popup_menu();
    open_popup_content(false, false, true);
  });
  $(".play-game-header-recommened-button").click(function () {
    let body = $("body");
    body.addClass("open_popup_content");
    close_popup_menu();
    open_popup_content(false, true);
  });
  $(".close_popup_content").click(function () {
    close_popup_content();
  });
  $(".app-popup__bg").click(function () {
    close_popup_content();
  });
  $(".play-game-header__title").click(() => {
    let body = $("body");
    body.addClass("open_popup_content");
    close_popup_menu();
    open_popup_content();
  });
}

function close_popup_content() {
  $(".app-popup__bg").removeClass("app-popup__bg_shadow");
  $("body").removeClass("open_popup_content");
  $(".app-popup").addClass("hidden");
}

function open_popup_content(
  is_intruction = false,
  is_recommened = false,
  is_description = false
) {
  close_popup();
  $(".app-popup__bg").addClass("app-popup__bg_shadow");
  $(".app-popup").removeClass("hidden");
  //game_slide_in_conten();
  if (is_description == true) {
    let targetElementDescription = $("#game-description");
    let popupContent = $("#game-page__content");
    let scrollToDescription =
      targetElementDescription.offset().top -
      popupContent.offset().top +
      popupContent.scrollTop();
    popupContent.animate(
      {
        scrollTop: scrollToDescription,
      },
      500
    ); // Adjust the duration as needed
  }
  if (is_intruction == true) {
    let targetElementInstruction = $("#game-instruction");
    let popupContent = $("#game-page__content");
    let scrollToInstruction =
      targetElementInstruction.offset().top -
      popupContent.offset().top +
      popupContent.scrollTop();
    popupContent.animate(
      {
        scrollTop: scrollToInstruction,
      },
      500
    ); // Adjust the duration as needed
  }
  if (is_recommened == true) {
    let targetElementRecommended = $("#game-recommended");
    let popupContent = $("#game-page__content");
    let scrollToRecommended =
      targetElementRecommended.offset().top -
      popupContent.offset().top +
      popupContent.scrollTop();
    popupContent.animate(
      {
        scrollTop: scrollToRecommended,
      },
      500
    ); // Adjust the duration as needed
  }
}

function game_slide_in_conten() {
  var swiperGameContent = new Swiper(
    ".games_home_related_content .game_home_slide_content",
    {
      slidesPerView: "auto",
      spaceBetween: 10,
      slidesPerGroup: 3,
      speed: 500,
      freeMode: true,
      noSwiping: true,
      noSwipingClass: "swiper-slide",
      navigation: {
        nextEl: ".games_home_related_content .next_btn",
        prevEl: ".games_home_related_content .prev_btn",
      },
    }
  );
  swiperGameContent.on("slideChange", function () {
    lazyLoad();
  });
}

function close_popup_menu() {
  let menu_popup = $(".play-game-header-menu");
  let body = $("body");
  body.removeClass("open_popup");
  if ($(".app_container").find(".popup-hide-fixer").length !== 0) {
    $(".app_container").find(".popup-hide-fixer").remove();
  }
  menu_popup.css({
    display: "none",
    position: "absolute",
    inset: "",
    margin: "0px",
  });
  // $(".popup-bg").hide();
}

function open_fullscreen() {
  $(".play-game-header").removeClass("has_ads_side");
  $(".game_area").removeClass("has_ads_side");
  $(".similar-games").addClass("hidden");
  $(".play-game-header__fullscreen")
    .find(".svg-icon__link")
    .html('<use xlink:href="#icon-shrink"></use>');
}

function close_fullscreen() {
  $(".similar-games").removeClass("hidden");
  $(".play-game-header").addClass("has_ads_side");
  $(".game_area").addClass("has_ads_side");
  $(".play-game-header__fullscreen")
    .find(".svg-icon__link")
    .html('<use xlink:href="#icon-fullscreen"></use>');
}

function toggleFullScreen(elem) {
  if (
    (document.fullScreenElement !== undefined &&
      document.fullScreenElement === null) ||
    (document.msFullscreenElement !== undefined &&
      document.msFullscreenElement === null) ||
    (document.mozFullScreen !== undefined && !document.mozFullScreen) ||
    (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)
  ) {
    if (elem.requestFullScreen) {
      elem.requestFullScreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullScreen) {
      elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}


function open_popup() {
  close_popup_menu();
  close_popup_content();
  $(".popup-bg").show();
  $(".popup-change-log").show();
  $("html").css("overflow", "hidden");
}

function close_popup() {
  $(".popup-bg").hide();
  $(".popup-change-log").hide();
  $("html").css("overflow", "");
  close_popup_menu();
}

function menu_header() {
  if ($(window).width() < 900) {
    $(".header-menu-button")
      .find("svg")
      .attr("style", " transform: rotateY(180deg);");
  }
  $(".header-menu-button").click(function () {
    if ($(window).width() < 900) {
      $(this).find("svg").attr("style", " transform: rotateY(180deg);");
      $("aside.menu-sidebar").toggleClass("mobile-open");
      if ($("aside.menu-sidebar").hasClass("mobile-open")) {
        open_sidebar();
        $("html").css("overflow", "hidden");
      } else {
        close_sidebar();
        $("html").css("overflow", "");
      }
    } else {
      $("aside.menu-sidebar").toggleClass("open");
      if ($("aside.menu-sidebar").hasClass("open")) {
        open_sidebar();
      } else {
        close_sidebar();
        $(".main-content").removeClass("open");
      }
    }
  });
  $("#menu_mobile").click(() => {
    $("#menu_mobile").toggleClass("open");
    if ($("#menu_mobile").hasClass("open")) {
      open_menuheader();
    } else {
      close_menuheader();
    }
  });
  $(".backdrop").click(function () {
    if ($(this).hasClass("mobile-open")) {
      close_sidebar();
      close_menuheader();
    }
  });
  // aside fit top
  let height_menu = $(".navbar").outerHeight();
  //console.log(height_menu)
  $(window).scroll(function () {
    if ($(window).scrollTop() > height_menu) {
      $(".menu-sidebar .menu").css("padding-top", "0px");
    } else {
      $(".menu-sidebar .menu").css("padding-top", height_menu + 8 + "px");
    }
  });
}

function open_sidebar() {
  $(".main-content").addClass("open");
  $(".backdrop").addClass("mobile-open");

  $(".header-menu-button").find("svg").attr("style", "");
}

function close_sidebar() {
  $(".backdrop").removeClass("mobile-open");
  $("aside.menu-sidebar").removeClass("mobile-open");
  $(".header-menu-button")
    .find("svg")
    .attr("style", "transform: rotateY(180deg);");
}

function open_menuheader() {
  $(".backdrop").addClass("mobile-open");
  $("#navbar").addClass("show");
  $("html").css("overflow", "hidden");
}

function close_menuheader() {
  $(".backdrop").removeClass("mobile-open");
  $("#navbar").removeClass("show");
  $("#menu_mobile").removeClass("open");
  $("html").css("overflow", "");
}

function hide_show_content() {
  let height_content = $(".content-inner .game-description").outerHeight();

  if (height_content <= 739) {
    $(".show_content").css({ display: "none" });

    $(".content-inner").attr("style", "height:unset");
  } else {
    $(".content-inner").attr("style", "height:740px;overflow:hidden");
    $(".show_content").css({ display: "flex" });
    $(".game_content").css({ "padding-bottom": "60px" });
    $(".game-description").css({ "padding-bottom": "20px" });
  }

  $(".ShowMore_button").click(function () {
    if ($(".ShowMore_button").hasClass("more")) {
      $(".ShowMore_button").removeClass("more");
      $(".content-inner").animate(
        {
          height: height_content + "px",
          overflow: "hidden",
          animation: "height 1000ms ease 0ms",
        },
        {
          easing: "swing",
          complete: function () {
            $(".content-inner").attr("style", "height:auto");
            $(".ShowMore_button").html(
              'Show less <span class="svg-icon" aria-hidden="true"> <svg class="svg-icon__link"> <use xlink:href="#icon-keyboard_arrow_up"></use> </svg></span>'
            );
            $(".ShowMore_button").addClass("less");
          },
        }
      );
    } else {
      $(".ShowMore_button").removeClass("less");
      $(".content-inner").animate(
        {
          height: "740px",
          overflow: "hidden",
          animation: "height 1000ms ease 0ms",
        },
        {
          easing: "swing",
          complete: function () {
            $(".content-inner").attr("style", "height:740px;overflow:hidden");
            $(".ShowMore_button").html(
              'Show more <span class="svg-icon" aria-hidden="true"> <svg class="svg-icon__link"> <use xlink:href="#icon-keyboard_arrow_down"></use> </svg></span>'
            );
            $(".ShowMore_button").addClass("more");
          },
        }
      );
    }
  });
}

function lazyLoad() {
  // $(".lazy").Lazy({
  //   effect: "fadeIn",
  //   effectTime: 300,
  // });
}



function slider_js() {
  var swiperGameHot = new Swiper(".games_home_related .game_home_slide", {
    slidesPerView: "auto",
    spaceBetween: 10,
    slidesPerGroup: 3,
    speed: 500,
    freeMode: true,
    navigation: {
      nextEl: ".games_home_related .next_btn",
      prevEl: ".games_home_related .prev_btn",
    },
    slidesOffsetBefore: 15,
    draggable: true,
  });
  swiperGameHot.on("slideChange", function () {
    lazyLoad();
  });
}

/*=========dialog control========*/
function open_dialog() {
  $(".toggleModalBtn").on("click", function () {
    var modalId = $(this).data("target"); // e.g., "#modalOverlay1"
    $(this).toggleClass("open");
    var $modalOverlay = $(modalId);

    // Reverse the logic: if the button now has the "open" class, then open the dialog.
    if ($(this).hasClass("open")) {
      $(".toggleModalBtn").removeClass("open");
      $(".toggleModalBtn").removeClass("active");
      $(this).addClass("open");
      $(this).addClass("active");
      // Open the modal
      $(".blur_dialog").removeClass("active");
      $(".blur_dialog").find(".game_dialog_container").removeClass("slide-out");
      $modalOverlay.addClass("active");
      // Remove any previous slide-out and force reflow
    } else {
      // Close the modal
      close_dialog(modalId);
    }
  });

  // Close modal when a close button is clicked
  $(".closeModalBtn").on("click", function () {
    // Pass the closest modal overlay
    close_dialog($(this).closest(".blur_dialog"));
  });
}

function close_dialog(modal) {
  var $modalOverlay = $(modal).closest(".blur_dialog");
  $(".toggleModalBtn").removeClass("open");
  $(".toggleModalBtn").removeClass("active");
  $modalOverlay.removeClass("active");
}

$(document).on("click", function (e) {
  if (
    !$(e.target).closest(".blur_dialog").length &&
    !$(e.target).closest(".toggleModalBtn").length
  ) {
    $(".blur_dialog.active").each(function () {
      close_dialog(this);
    });
  }
});
/*=========dialog control========*/
/*=========Vote========*/
$(document).on("click", ".button_vote_game", function () {
  event_send_vote(this);
});

function add_module() {
  if (!game_config.url_game) {
    return;
  }
  let url = "/add-module.ajax";
  $.ajax({
    url: url,
    type: "POST",
    data: {
      url_game: game_config.url_game,
    },
    success: function (response) {
      if (response) {
        let data = JSON.parse(response);
        if ($("#csrf-token").length) {
          $("#csrf-token").remove();
        }
        if ($("#gmuid").length) {
          $("#gmuid").remove();
        }
        $("body").append(data.gm_layout);
        game_vote_load();
      }
    },
  });
}

function event_send_vote(e) {
  let _game_id = $(e).data("game");
  let _vote = $(e).data("vote");
  let _url = $("#game_vote_panel").data("url");

  let voteUpBtn = $("#vote-up");
  let voteDownBtn = $("#vote-down");
  let upCountEl = $("#up-count");
  let downCountEl = $("#down-count");
  let child_up_last = voteUpBtn.find(".g-footer__button-title_last");
  let child_down_last = voteDownBtn.find(".g-footer__button-title_last");

  let interacted = $(e).hasClass("voted");
  $(".button_vote_game").removeClass("voted");
  $(".g-footer__button-title_last").text("");
  child_down_last.text("Dislike");
  child_up_last.text("Like");

  let local_storage_key = "voted_game";
  let voted_data = readFromLocalStorage(local_storage_key);
  let pre_vote = "";
  if (voted_data && voted_data.length > 0) {
    $.each(voted_data, function (key, voted_game) {
      if (voted_game.id == _game_id) {
        pre_vote = voted_game.vote;
      }
    });
  }
  if (!interacted) {
    $(e).addClass("voted");
    $(e).find(".g-footer__button-title_last").text("Remove");
  }
  $(e).blur();
  let token = $("#csrf-token").val();
  let gmuid = $("#gmuid").val();
  if (e == null) return;
  $.ajax({
    url: "/game-vote.ajax",
    method: "POST",
    data: {
      vote: _vote,
      id: _game_id,
      token: token,
      gmuid: gmuid,
      url: _url,
      pre_vote: pre_vote,
    },
    success: function (voteData) {
      upCountEl.text(formatNumber(voteData.up_count) || 0);
      downCountEl.text(formatNumber(voteData.down_count) || 0);
      $("#csrf-token").val(voteData.t);
      game_vote_save(_game_id, _vote);
    },
    error: function (jqxhr, textStatus, error) {
      console.error("Error:", error);
    },
  });
}

function game_vote_save(_id, _vote) {
  if (!!readFromLocalStorage("voted_game") && _id !== "" && _vote !== "") {
    let voted_array = readFromLocalStorage("voted_game");
    let interacted = false;
    jQuery.each(voted_array, function (key, value) {
      if (value !== undefined && value.id === _id && key > -1) {
        if (value.vote === _vote) {
          interacted = true;
        }
        voted_array.splice(key, 1);
      }
    });
    if (interacted) {
      saveToLocalStorage("voted_game", JSON.stringify(voted_array));
      return;
    }
    voted_array.push({
      id: _id,
      vote: _vote,
    });
    saveToLocalStorage("voted_game", JSON.stringify(voted_array));
  } else {
    var voted_array = [];
    voted_array.push({
      id: _id,
      vote: _vote,
    });
    saveToLocalStorage("voted_game", JSON.stringify(voted_array));
  }
}

function game_vote_load() {
  if ($("#game_vote_panel").length > 0) {
    let _game_id = $("#game_vote_panel").data("game");
    let _url = $("#game_vote_panel").data("url");
    var token = $("#csrf-token").val();
    let voteUpBtn = $("#vote-up");
    let voteDownBtn = $("#vote-down");
    let upCountEl = $("#up-count");
    let downCountEl = $("#down-count");
    let child_up_last = voteUpBtn.find(".g-footer__button-title_last");
    let child_down_last = voteDownBtn.find(".g-footer__button-title_last");
    $.getJSON("/game-vote.ajax", { id: _game_id, token: token, url: _url })
      .done(function (voteData) {
        upCountEl.text(formatNumber(voteData.up_count) || 0);
        downCountEl.text(formatNumber(voteData.down_count) || 0);
        $("#csrf-token").val(voteData.t);
        //load state vote
        let local_storage_key = "voted_game";
        //  console.log(readFromLocalStorage(local_storage_key));
        if (!!readFromLocalStorage(local_storage_key)) {
          var voted_game = readFromLocalStorage(local_storage_key);
          let _voted = "";
          if (voted_game.length > 0) {
            $.each(voted_game, function (key, voted_game) {
              if (voted_game.id == _game_id) {
                _voted = voted_game.vote;

                if (_voted === "like") {
                  voteUpBtn.addClass("voted");
                  child_up_last.text("Remove");
                  voteDownBtn.removeClass("voted");
                } else if (_voted === "dislike") {
                  voteDownBtn.addClass("voted");
                  child_down_last.text("Remove");
                  voteUpBtn.removeClass("voted");
                  console.log("dislike");
                } else {
                  voteUpBtn.removeClass("voted");
                  voteDownBtn.removeClass("voted");
                  child_down_last.text("Dislike");
                  child_up_last.text("Like");
                  console.log("not vote");
                }
              }
            });
          }
        }
        //load comemnt
        if (game_config.show_comment !== "yes") return;
        //load_comment(1, 10, "newest", _url, "#list_comment", "f5", voteData.t);
      })
      .fail(function (jqxhr, textStatus, error) {
        console.log("Request Failed: " + textStatus + ", " + error);
      });
    //
  }
}

function formatNumber(num) {
  // For numbers less than 1000, return the number as-is.
  if (num < 1000) {
    return num.toString();
  }

  // Define suffixes for thousands, millions, billions, and trillions.
  var suffixes = ["k", "M", "B", "T"];
  var suffixIndex = -1;
  var formattedNum = num;

  // Divide the number by 1000 until it is less than 1000, increasing the suffix index each time.
  while (formattedNum >= 1000 && suffixIndex < suffixes.length - 1) {
    formattedNum /= 1000;
    suffixIndex++;
  }

  // Format the number with one decimal place if it's less than 10, otherwise use no decimals.
  var precision = formattedNum < 10 ? 1 : 0;
  return formattedNum.toFixed(precision) + suffixes[suffixIndex];
}

/*=========Vote========*/

/*=========LocalStorage========*/
function saveToLocalStorage(key, value) {
  // Convert value to JSON string if it's not already a string
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  localStorage.setItem(key, stringValue);
}

function readFromLocalStorage(key) {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) {
    // Key not found
    return [];
  }

  // Try to parse the stored string as JSON.
  // If parsing fails, return it as a string.
  try {
    return JSON.parse(storedValue);
  } catch (err) {
    return storedValue;
  }
}

function removeFromLocalStorage(key) {
  localStorage.removeItem(key);
}

/*=========LocalStorage========*/


