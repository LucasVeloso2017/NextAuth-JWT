import { GetServerSideProps } from "next";
import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { parseCookies } from "nookies";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      email,
      password,
    };

    await signIn(data);
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        name="email"
        id="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        name="password"
        id="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
});
