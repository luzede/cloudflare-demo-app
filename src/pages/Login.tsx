// The good thing about this is that when the component is first loaded,
// the form fields are not validated until the user submits the form.
// After that, with every change in the form fields, the validation
// happens instantly on each keystroke.

// Hooks and other utilities
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import axios from "axios";

// Components
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertErrorMessage } from "@/components";
import { useToken } from "@/tokenContext";

// Schemas
import { loginSchema } from "@/zodSchemas";

export default function Login() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { token, setToken } = useToken();

	// If navigated from registration page and registration was successful
	// then the current location state will have "accountCreated" attribute
	// and its value will be true
	const location = useLocation();
	const toaster = useToast();
	const [loginError, setLoginError] = useState<{
		message: string;
		name?: string;
	} | null>(null);

	// "navigate" should only be used in response to user action
	// or inside a useEffect hook, otherwise it will not navigate
	// to the desired page unless the component is re-rendered
	// (Or something like that, in my trial, component rendered even though
	// before I returned the page from the function, I navigated to another page
	// Maybe I have to first let it render, and then navigate)
	useEffect(() => {
		if (token) {
			navigate("/");
		}
	}, [token, navigate]);

	// I just want it to run once when the component is mounted
	// and I can't do it without suppressing the lint warning
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		// If the location state has "accountCreated" attribute
		// then show a toast message to the user that the account
		// was created successfully
		if (location.state?.accountCreated) {
			toaster.toast({
				variant: "default",
				title: "Success",
				duration: 5000,
				description:
					"Account created successfully, please login to access your account",
			});
			// This replaces the current page in the history stack
			// which has the accountCreated attribute in the state
			// with a new page which does not have the accountCreated
			navigate("/login", { replace: true });
		}
	}, []);

	const loginForm = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	// This does not handle the "onSubmit" event of the form,
	// it just takes in the values of the form fields that are
	// The real onSubmit event handler is created with the
	// "loginForm.handleSubmit()" function." which takes in the
	// "SubmitEvent" argument and passes the form field values
	// to the "onSubmit" function that we defined below.
	async function onSubmit(values: z.infer<typeof loginSchema>) {
		try {
			// Login the user by sending the form field values to the server
			// and get the token in response if the login is successful
			const resp = await axios.post<{ token: string }>("/api/login", values, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Save the token in the local storage
			// and redirect the user to the home page
			localStorage.setItem("token", resp.data.token);
			setToken(resp.data.token);
			queryClient.invalidateQueries();
			queryClient.resetQueries();
			navigate("/");
		} catch (err) {
			if (err instanceof axios.AxiosError) {
				if (err.response?.status === 401) {
					setLoginError(err.response.data as { message: string });
				} else {
					setLoginError({
						message: "An error occurred during login process in the account.",
					});
				}
			}
		}
	}

	function onClick() {
		const form = document.getElementById("login-form") as HTMLFormElement;
		// form.addEventListener("submit", (e) => e.preventDefault());
		// There is already a submit event listener on the form that prevents
		// the default behavior, so we just call "requestSubmit()" to trigger
		// the onSubmit event. "submit()" does not trigger onSubmit event nor
		// validates the input before submitting the form field contents
		// and it also cannot be stopped by preventDefault, it just refreshes
		// without emitting the onSubmit event.
		// All this is handle by the "loginForm.handleSubmit" function to which
		// we pass our onSubmit event handler.
		form.requestSubmit();
	}

	return token ? (
		<></>
	) : (
		<Card className="w-full max-w-md mx-auto my-32 lg:my-12">
			<CardHeader>
				<CardTitle className="text-center">Login</CardTitle>
				<CardDescription className="text-center">
					Enter your email and password to access your account
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loginError && (
					<AlertErrorMessage
						description={loginError.message}
						title={loginError.name || "Error"}
					/>
				)}
				<Form {...loginForm}>
					<form
						id="login-form"
						onSubmit={loginForm.handleSubmit(onSubmit)}
						className="space-y-8"
					>
						<FormField
							control={loginForm.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									{/* 
                                It automatically assigns htmlFor on the label and id on the input
                                along with name and other attributes, however the id does not equal
                                to the name of the label, to give it a custom name, you have to
                                explicitly give it id and htmlFor and other attributes 
                            */}
									<FormLabel htmlFor="username">Username</FormLabel>
									<FormControl>
										<Input {...field} id="username" autoComplete="username" />
									</FormControl>
									<FormMessage className="" />
								</FormItem>
							)}
						/>
						<FormField
							control={loginForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="password">Password</FormLabel>
									<FormControl>
										<Input
											{...field}
											id="password"
											type="password"
											autoComplete="current-password"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
			</CardContent>
			<CardFooter className="flex flex-col items-center gap-3">
				<Button variant={"link"}>
					<Link to="/register">Register?</Link>
				</Button>
				<Button onClick={onClick} className="w-full">
					Login
				</Button>
			</CardFooter>
		</Card>
	);
}
