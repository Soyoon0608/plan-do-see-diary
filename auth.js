/* =========================================================
   Plan Do See Diary
   Supabase Authentication
   ========================================================= */


/* ---------------------------------------------------------
   Supabase 설정
   --------------------------------------------------------- */

const SUPABASE_URL =
  "https://ptrsztelwuwrbounfpod.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* ---------------------------------------------------------
   공통 메시지 함수
   --------------------------------------------------------- */

function showMessage(
  element,
  message,
  type = "error"
) {
  if (!element) {
    return;
  }

  element.textContent = message;

  element.className =
    `auth-message show ${type}`;
}


/* ---------------------------------------------------------
   로그인
   --------------------------------------------------------- */

const loginForm =
  document.getElementById(
    "loginForm"
  );

if (loginForm) {

  const loginEmail =
    document.getElementById(
      "loginEmail"
    );

  const loginPassword =
    document.getElementById(
      "loginPassword"
    );

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const loginMessage =
    document.getElementById(
      "loginMessage"
    );


  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        loginEmail.value
          .trim();

      const password =
        loginPassword.value;


      if (!email || !password) {

        showMessage(
          loginMessage,
          "이메일과 비밀번호를 입력해주세요."
        );

        return;
      }


      loginButton.disabled = true;
      loginButton.textContent =
        "로그인 중...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient
            .auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          console.error(
            "LOGIN ERROR:",
            error
          );

          /*
           * T07-C99
           *
           * 존재하지 않는 계정과
           * 비밀번호가 틀린 경우에
           * 같은 안내 문구를 사용합니다.
           */

          showMessage(
            loginMessage,
            "이메일 또는 비밀번호가 올바르지 않습니다."
          );

          return;
        }


        if (!data.session) {

          showMessage(
            loginMessage,
            "로그인 세션을 확인할 수 없습니다."
          );

          return;
        }


        /*
         * 로그인 성공
         */

        window.location.href =
          "index.html";

      }

      catch (error) {

        console.error(
          "LOGIN EXCEPTION:",
          error
        );

        showMessage(
          loginMessage,
          "로그인 중 문제가 발생했습니다."
        );

      }

      finally {

        loginButton.disabled =
          false;

        loginButton.textContent =
          "로그인";
      }

    }
  );
}


/* ---------------------------------------------------------
   회원가입
   --------------------------------------------------------- */

const signupForm =
  document.getElementById(
    "signupForm"
  );

if (signupForm) {

  const signupEmail =
    document.getElementById(
      "signupEmail"
    );

  const signupPassword =
    document.getElementById(
      "signupPassword"
    );

  const signupPasswordConfirm =
    document.getElementById(
      "signupPasswordConfirm"
    );

  const signupButton =
    document.getElementById(
      "signupButton"
    );

  const signupMessage =
    document.getElementById(
      "signupMessage"
    );


  signupForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        signupEmail.value
          .trim();

      const password =
        signupPassword.value;

      const passwordConfirm =
        signupPasswordConfirm.value;


      /* 이메일 확인 */

      if (!email) {

        showMessage(
          signupMessage,
          "이메일을 입력해주세요."
        );

        return;
      }


      /* 비밀번호 길이 */

      if (password.length < 6) {

        showMessage(
          signupMessage,
          "비밀번호는 6자 이상 입력해주세요."
        );

        return;
      }


      /* 비밀번호 확인 */

      if (
        password !==
        passwordConfirm
      ) {

        showMessage(
          signupMessage,
          "비밀번호가 일치하지 않습니다."
        );

        return;
      }


      signupButton.disabled =
        true;

      signupButton.textContent =
        "가입 처리 중...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient
            .auth
            .signUp({
              email,
              password
            });

if (error) {

  console.error(
    "SIGNUP ERROR:",
    error
  );

  const errorMessage =
    error.message?.toLowerCase() || "";

  if (
    errorMessage.includes("rate limit") ||
    error.status === 429
  ) {

    showMessage(
      signupMessage,
      "회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
    );

  } else if (
    errorMessage.includes("already registered") ||
    errorMessage.includes("already exists")
  ) {

    showMessage(
      signupMessage,
      "이미 가입된 이메일입니다."
    );

  } else {

    showMessage(
      signupMessage,
      "회원가입에 실패했습니다. 입력한 정보를 확인해주세요."
    );
  }

  return;
}



        /*
         * Supabase 이메일 확인 설정에 따라
         * session이 바로 생성되지 않을 수 있습니다.
         */

        if (
          data.user &&
          !data.session
        ) {

          showMessage(
            signupMessage,
            "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
            "success"
          );


          signupForm.reset();

          return;
        }


        /*
         * 이메일 인증 없이
         * 바로 로그인 가능한 설정이라면
         * 로그인 화면으로 이동합니다.
         */

        if (data.session) {

          window.location.href =
            "index.html";

          return;
        }


        showMessage(
          signupMessage,
          "회원가입이 완료되었습니다. 로그인 화면으로 이동해주세요.",
          "success"
        );

      }

      catch (error) {

        console.error(
          "SIGNUP EXCEPTION:",
          error
        );

        showMessage(
          signupMessage,
          "회원가입 중 문제가 발생했습니다."
        );

      }

      finally {

        signupButton.disabled =
          false;

        signupButton.textContent =
          "회원가입";
      }

    }
  );
}


/* ---------------------------------------------------------
   이미 로그인한 상태인지 확인
   --------------------------------------------------------- */

async function redirectIfAlreadyLoggedIn() {

  const {
    data
  } =
    await supabaseClient
      .auth
      .getSession();


  if (
    data &&
    data.session
  ) {

    const currentPage =
      window.location.pathname
        .split("/")
        .pop();


    if (
      currentPage ===
        "login.html" ||
      currentPage ===
        "signup.html"
    ) {

      window.location.href =
        "index.html";
    }
  }
}


/* ---------------------------------------------------------
   로그인 상태 변경 감지
   --------------------------------------------------------- */

supabaseClient
  .auth
  .onAuthStateChange(
    (event, session) => {

      console.log(
        "AUTH EVENT:",
        event
      );

    }
  );


/* ---------------------------------------------------------
   시작
   --------------------------------------------------------- */

redirectIfAlreadyLoggedIn();

