(function ($) {
   "use strict";

      if ($('#coundown-holder').length > 0) {
         // Initiate Countdown
         $('#coundown-holder').countDown({
            targetDate: {
               'day': 27,
               'month': 8,
               'year': 2017,
               'hour': 0,
               'min': 0,
               'sec': 0
            },
            omitWeeks: true
         });
      }

      function getImgSize(el, imgSrc) {
         var newImg = new Image();
         newImg.onload = function () {
            var height = newImg.height;
            var width = newImg.width;

            el.css('height', height);

         };
         newImg.src = imgSrc;
      }

      if ($('.bg-image[data-bg-image]').length > 0) {
         $('.bg-image[data-bg-image]').each(function () {
            var el = $(this);
            var sz = getImgSize(el, el.attr("data-bg-image"));
            el.css('background-position', 'center').css('background-image', "url('" + el.attr("data-bg-image") + "')").css('background-size', 'cover').css('background-repeat', 'no-repeat');
         });
      }

      $('[data-placeholder]').on('focus', function () {
         var input = $(this);
         if (input.val() === input.attr('data-placeholder')) {
            input.val('');
         }
      }).on('blur', function () {
         var input = $(this);
         if (input.val() === '' || input.val() === input.attr('data-placeholder')) {
            input.addClass('placeholder');
            input.val(input.attr('data-placeholder'));
         }
      }).blur();

      $('[data-placeholder]').parents('form').submit(function () {
         $(this).find('[data-placeholder]').each(function () {
            var input = $(this);
            if (input.val() === input.attr('data-placeholder')) {
               input.val('');
            }
         });
      });

      function checkForm() {
         if ($(".form-holder").length > 0) {

            var formStatus = $(".form-holder form").validate();

            //   ===================================================== 
            //sending contact form
            $(".form-holder form").on('submit', function (e) {
               e.preventDefault();

               //  triggers contact form validation

               if (formStatus.errorList.length === 0)
               {
                  $(".form-holder form").fadeOut(function () {
                     $('#loading').css('visibility', 'visible');
                     $.post('submit.php', $(".form-holder form").serialize(),
                             function (data) {

                                $('.message-box').html(data);


                                $('#loading').css('visibility', 'hidden');

                             }

                     );
                  });


               }

            });
         }
      }
  
})(jQuery);

