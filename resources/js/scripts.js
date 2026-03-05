window.addEventListener("DOMContentLoaded", function () {
    //slider_js();
    //search_complete();
    //search_mobile();
    $(window).scroll(function () {
        var aTop = $('#header').outerHeight();
        if ($(this).scrollTop() >= aTop) {
            $('#menu').css({
                'position': 'fixed', 'margin': '0 0 0 -34px', 'height': '100vh', 'top': '0'
            });
        } else {
            $('#menu').css({
                'position': 'absolute', 'margin': '40px 0 0 -34px', 'height': 'calc(100vh - 61px)'
            });
        }
    });


    var mode = readFromLocalStorage('mode');

    if (mode === 'light') {
        $('html').attr('data-theme', '');
        $('.layout-header').removeClass('navbar-dark').addClass('navbar-light');
        $('.color-toggle').addClass('toggled');
    } else {
        $('html').attr('data-theme', 'dark');
        $('.layout-header').addClass('navbar-dark').removeClass('navbar-light');
        $('.color-toggle').removeClass('toggled');
    }

    // Sự kiện toggle
    $(document).on('click', '.color-toggle', function () {
        $(this).toggleClass('toggled');

        if ($(this).hasClass("toggled")) {
            // Light mode
            saveToLocalStorage('mode', 'light');
            $('html').attr('data-theme', '');
            $('.layout-header').removeClass('navbar-dark').addClass('navbar-light');
        } else {
            // Dark mode
            saveToLocalStorage('mode', 'dark');
            $('html').attr('data-theme', 'dark');
            $('.layout-header').addClass('navbar-dark').removeClass('navbar-light');
        }
    });
    menu_header()

});

function menu_header() {
    if ($(window).width() < 900) {
        $(".header-menu-button").find("svg").attr("style", " transform: rotateY(180deg);")
    }
    $(".header-menu-button").click(function () {
        if ($(window).width() < 900) {
            $(this).find("svg").attr("style", " transform: rotateY(180deg);")
            $("aside.menu-sidebar").toggleClass("mobile-open");
            if ($("aside.menu-sidebar").hasClass("mobile-open")) {
                open_sidebar();
                $('html').css("overflow","hidden");
            } else {
                close_sidebar();
                $('html').css("overflow","");
            }
        } else {
            $("aside.menu-sidebar").toggleClass("open");
            if ($("aside.menu-sidebar").hasClass("open")) {
                open_sidebar()
            } else {
                close_sidebar()
                $(".main-content").removeClass("open");
            }
        }

    })
    $("#menu_mobile").click(() => {
        $("#menu_mobile").toggleClass("open");
        if ($("#menu_mobile").hasClass("open")) {
            open_menuheader()
        } else {
            close_menuheader()
        }
    })
    $(".backdrop").click(function () {
        if ($(this).hasClass("mobile-open")) {
            close_sidebar();
            close_menuheader();
        }
    })
    // aside fit top
    let height_menu = $(".navbar").outerHeight();
    //console.log(height_menu)
    $(window).scroll(function () {
        if ($(window).scrollTop() > height_menu) {
            $(".menu-sidebar .menu").css("padding-top", "0px");
        } else {
            $(".menu-sidebar .menu").css("padding-top", (height_menu + 8) + "px");
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
    $(".header-menu-button").find("svg").attr("style", "transform: rotateY(180deg);")
}

function open_menuheader() {
    $(".backdrop").addClass("mobile-open");
    $("#navbar").addClass("show");
    $('html').css("overflow","hidden");
}

function close_menuheader() {
    $(".backdrop").removeClass("mobile-open");
    $("#navbar").removeClass("show");
    $("#menu_mobile").removeClass("open");
    $('html').css("overflow","");
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



/*=========LocalStorage========*/
function saveToLocalStorage(key, value) {
    // Convert value to JSON string if it's not already a string
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
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


 